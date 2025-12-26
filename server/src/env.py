from os import getenv
from dotenv import load_dotenv

load_dotenv()

environment = getenv("ENVIRONMENT", "development")
database_url = getenv("DATABASE_URL", "")
checkpoint_saver_url = getenv("CHECKPOINT_SAVER_URL", "")

openrouter_api_key = getenv("OPENROUTER_API_KEY")
openrouter_base_url = getenv("OPENROUTER_BASE_URL")

if not openrouter_api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")
if not openrouter_base_url:
    raise ValueError("OPENROUTER_BASE_URL environment variable is required")