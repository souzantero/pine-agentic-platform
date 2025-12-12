from langgraph.checkpoint.postgres import PostgresSaver
from sqlmodel import Session, create_engine

from src.env import database_url

engine = create_engine(database_url)


def get_session():
    with Session(engine) as session:
        yield session

def get_checkpoint_saver():
    with PostgresSaver.from_conn_string(database_url) as checkpoint_saver:
        yield checkpoint_saver
