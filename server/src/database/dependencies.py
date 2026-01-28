from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from .connection import get_session

DatabaseDependency = Annotated[Session, Depends(get_session)]
