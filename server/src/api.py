from contextlib import asynccontextmanager

from fastapi.responses import StreamingResponse
import src.env  # noqa: F401

from fastapi import Depends, FastAPI, Query, Request
from sqlmodel import Session, col, select
from typing import Annotated

from src.agent import build_agent
from src.entities import Thread
from src.database import get_session, open_checkpoint_saver

SessionDependency = Annotated[Session, Depends(get_session)]

checkpoint_saver = None
checkpoint_saver_stack = None
agent_graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent_graph, checkpoint_saver, checkpoint_saver_stack
    checkpoint_saver_stack, checkpoint_saver = await open_checkpoint_saver()
    await checkpoint_saver.setup()
    agent_graph = build_agent(checkpoint_saver)

    try:
        yield
    finally:
        if checkpoint_saver_stack is not None:
            await checkpoint_saver_stack.aclose()
            checkpoint_saver_stack = None
            checkpoint_saver = None


app = FastAPI(title="Pinechat API", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}


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
