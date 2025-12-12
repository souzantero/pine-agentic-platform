from typing import Annotated
from fastapi import Depends, FastAPI
from sqlmodel import Session

from src.entities import Thread
from src.database import get_session

app = FastAPI()

SessionDependency = Annotated[Session, Depends(get_session)]


@app.post("/threads")
def create_thread(thread: Thread, session: SessionDependency):
    session.add(thread)
    session.commit()
    session.refresh(thread)
    return thread
