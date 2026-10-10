import os
from dotenv import load_dotenv

load_dotenv(override=True)


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "crm-development-secret")
    DATABASE_URL = os.getenv("DATABASE_URL")