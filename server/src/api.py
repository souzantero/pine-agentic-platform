import src.env  # noqa: F401
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import open_checkpointer, close_checkpointer
from src.routers import auth, configs, invites, members, models, organizations, providers, roles, threads


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia recursos no startup e shutdown."""
    # Startup
    await open_checkpointer()
    yield
    # Shutdown
    await close_checkpointer()


app = FastAPI(title="PineChat API", version="1.0.0", lifespan=lifespan)

# CORS - permitir frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(members.router)
app.include_router(invites.router)
app.include_router(roles.router)
app.include_router(threads.router)
app.include_router(providers.router)
app.include_router(models.router)
app.include_router(configs.router)
