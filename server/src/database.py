from sqlmodel import Session, create_engine

from src.env import database_url

engine = create_engine(database_url)


def get_session():
    with Session(engine) as session:
        yield session
