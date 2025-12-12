import src.env  # noqa: F401

from typing import Annotated
from fastapi import Depends, FastAPI, Query
from langgraph.checkpoint.postgres import PostgresSaver
from sqlmodel import Session, col, select

from src.agent import build_agent
from src.entities import Thread
from src.database import get_checkpoint_saver, get_session
from src.helpers import get_config
from src.models import RunBody

app = FastAPI()

SessionDependency = Annotated[Session, Depends(get_session)]
CheckpointSaverDependency = Annotated[PostgresSaver, Depends(get_checkpoint_saver)]


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


@app.get("/threads/{thread_id}/state")
async def get_thread(thread_id: str, checkpointer: CheckpointSaverDependency):
    agent = build_agent(checkpointer)
    state = agent.get_state(config=get_config(thread_id))
    return state.values


@app.post("/threads/{thread_id}/runs/wait")
async def wait_run(
    thread_id: str, body: RunBody, checkpointer: CheckpointSaverDependency
):
    agent = build_agent(checkpointer)
    messages = [m.to_agent() for m in body.input.messages]
    agent.invoke({"messages": messages}, config=get_config(thread_id))
