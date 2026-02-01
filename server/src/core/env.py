from os import getenv
from dotenv import load_dotenv

load_dotenv()

environment = getenv("ENVIRONMENT", "development")
database_url = getenv("DATABASE_URL", "")
checkpoint_saver_url = getenv("CHECKPOINT_SAVER_URL", "")

# OpenRouter base URL (API keys vem do banco de dados por organizacao)
openrouter_base_url = getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# JWT
jwt_secret = getenv("JWT_SECRET", "dev-secret-change-in-production")
jwt_algorithm = getenv("JWT_ALGORITHM", "HS256")
jwt_expiration_hours = int(getenv("JWT_EXPIRATION_HOURS", "24"))

# Email (Resend)
resend_api_key = getenv("RESEND_API_KEY", "")
resend_from_email = getenv("RESEND_FROM_EMAIL", "PineAI <noreply@pine.net.br>")
app_url = getenv("APP_URL", "http://localhost:3000")

# Verificacao de email
email_verification_token_expiration_hours = int(getenv("EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS", "24"))
email_verification_rate_limit_seconds = int(getenv("EMAIL_VERIFICATION_RATE_LIMIT_SECONDS", "60"))

# Reset de senha
password_reset_token_expiration_hours = int(getenv("PASSWORD_RESET_TOKEN_EXPIRATION_HOURS", "1"))