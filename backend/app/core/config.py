from pydantic_settings import BaseSettings


def Minutes(x: int) -> int: return x
def Hours(x: int) -> int: return Minutes(x * 60)
def Days(x: int) -> int: return Hours(x * 24)


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = "sqlite:///../config/budget.sqlite"

    # Plaid API credentials
    PLAID_CLIENT_ID: str
    PLAID_SECRET: str

    # JWT settings
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Hours(8)

    # Default user credentials
    DEFAULT_USER_USERNAME: str = "admin"
    DEFAULT_USER_PASSWORD: str = "password"  # Change this in production!

    class Config:
        env_file = '.env'


settings = Settings() # type: ignore
