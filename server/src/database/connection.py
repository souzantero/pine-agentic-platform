from contextlib import AsyncExitStack

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlmodel import Session, create_engine

from src.core.env import database_url, checkpoint_saver_url

engine = create_engine(database_url)


def get_session():
    with Session(engine) as session:
        yield session


Database = Session


# Variaveis globais para o checkpointer
_checkpointer: AsyncPostgresSaver | None = None
_checkpointer_stack: AsyncExitStack | None = None


async def open_checkpointer() -> AsyncPostgresSaver:
    """Abre conexao do checkpointer no startup."""
    global _checkpointer, _checkpointer_stack
    _checkpointer_stack = AsyncExitStack()
    cm = AsyncPostgresSaver.from_conn_string(checkpoint_saver_url)
    _checkpointer = await _checkpointer_stack.enter_async_context(cm)
    await _checkpointer.setup()
    return _checkpointer


async def close_checkpointer():
    """Fecha conexao do checkpointer no shutdown."""
    global _checkpointer, _checkpointer_stack
    if _checkpointer_stack is not None:
        try:
            await _checkpointer_stack.aclose()
        except Exception:
            pass  # Ignora erros de cancelamento
        finally:
            _checkpointer_stack = None
            _checkpointer = None


def get_checkpointer() -> AsyncPostgresSaver:
    """Retorna o checkpointer global."""
    if _checkpointer is None:
        raise RuntimeError("Checkpointer nao inicializado")
    return _checkpointer
