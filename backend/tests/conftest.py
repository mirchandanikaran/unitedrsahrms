"""Pytest setup — run before test modules import the app."""
import os

# Use SQLite so CI / dev machines don't need PostgreSQL for tests
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_ems.db")
