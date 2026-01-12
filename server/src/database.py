from typing import Annotated

from fastapi import Depends
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlmodel import Session, create_engine

from src.env import database_url, checkpoint_saver_url

engine = create_engine(database_url)


def get_session():
    with Session(engine) as session:
        yield session


# Type alias para injecao de dependencia do banco de dados
DatabaseSession = Annotated[Session, Depends(get_session)]


async def get_checkpoint_saver():
    async with AsyncPostgresSaver.from_conn_string(checkpoint_saver_url) as checkpoint_saver:
        yield checkpoint_saver
