import json
from typing import Annotated, Any, Dict

import src.env  # noqa: F401
from fastapi import Depends, FastAPI, Query
from fastapi.responses import StreamingResponse
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlmodel import Session, col, select

from src.agent import build_agent
from src.database import get_checkpoint_saver, get_session
from src.entities import Thread
from src.helpers import agent_messages_to_list, chunk_to_text, get_config
from src.routers import auth, organizations
from src.schemas import RunPayload

app = FastAPI(title="PineChat API", version="1.0.0")

# Routers
app.include_router(auth.router)
app.include_router(organizations.router)

SessionDependency = Annotated[Session, Depends(get_session)]
CheckpointSaverDependency = Annotated[AsyncPostgresSaver, Depends(get_checkpoint_saver)]


@app.post("/threads")
def create_thread(thread: Thread, session: SessionDependency):
    session.add(thread)
    session.commit()
    session.refresh(thread)
    return thread


@app.get("/threads/search")
async def search_threads(
    session: SessionDependency,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    statement = (
        select(Thread)
        .offset(offset)
        .order_by(col(Thread.created_at).desc())
        .limit(limit)
    )
    return session.exec(statement).all()


@app.get("/threads/{thread_id}/state/messages")
async def get_thread(thread_id: str, checkpointer: CheckpointSaverDependency):
    agent = build_agent(checkpointer)
    state_snapshot = await agent.aget_state(config=get_config(thread_id))
    state_messages = state_snapshot.values.get("messages", [])
    return {"messages": agent_messages_to_list(state_messages)}


@app.post("/threads/{thread_id}/runs/invoke")
async def invoke_run(
    thread_id: str, payload: RunPayload, checkpointer: CheckpointSaverDependency
):
    agent = build_agent(checkpointer)
    messages = [m.to_agent() for m in payload.input.messages]
    state_values = await agent.ainvoke(
        {"messages": messages}, config=get_config(thread_id)
    )
    state_messages = state_values.get("messages", [])
    return {"messages": agent_messages_to_list(state_messages)}


@app.post("/threads/{thread_id}/runs/stream")
async def stream_run(
    thread_id: str, payload: RunPayload, checkpointer: CheckpointSaverDependency
):
    agent = build_agent(checkpointer)
    config = get_config(thread_id)
    messages = [m.to_agent() for m in payload.input.messages]

    def sse_response_payload(data: Dict[str, Any]) -> str:
        """Formato básico text/event-stream."""
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_iterator():
        """Traduz eventos do LangGraph em mensagens SSE (chunk/final/done)."""
        try:
            # Primeiro: faz streaming dos chunks para o frontend
            async for event in agent.astream_events(
                {"messages": messages},
                config=config,
            ):
                event_name = event.get("event")
                if event_name == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    text = chunk_to_text(chunk) if chunk is not None else ""
                    if not text:
                        continue
                    # Cada pedaço do modelo vira um evento chunk no SSE
                    yield sse_response_payload({"event": "chunk", "text": text})

            # IMPORTANTE: O loop acima só termina quando astream_events() completar TOTALMENTE,
            # incluindo a persistência no checkpointer. Não damos break antecipado.

            # Agora sim, busca as mensagens já salvas no checkpointer
            state_snapshot = await agent.aget_state(config=config)
            state_messages = state_snapshot.values.get("messages", [])

            # Evento final entrega o histórico completo já salvo no Postgres/checkpointer
            yield sse_response_payload(
                {
                    "event": "final",
                    "messages": agent_messages_to_list(state_messages),
                }
            )
            # Evento done apenas sinaliza encerramento da stream
            yield sse_response_payload({"event": "done"})
        except Exception as exc:
            print(exc)
            yield sse_response_payload({"event": "error", "detail": str(exc)})

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        event_iterator(), media_type="text/event-stream", headers=headers
    )
