import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.core.config import settings

def create_database_if_not_exists():
    print(f"Connecting to PostgreSQL server at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT} as '{settings.POSTGRES_USER}'...")
    try:
        # Connect to default postgres DB first
        conn = psycopg2.connect(
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if studenthub_db exists
        target_db = settings.POSTGRES_DB
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname='{target_db}'")
        exists = cursor.fetchone()

        if not exists:
            print(f"Database '{target_db}' does not exist. Creating database...")
            cursor.execute(f'CREATE DATABASE "{target_db}"')
            print(f"Database '{target_db}' created successfully!")
        else:
            print(f"Database '{target_db}' already exists.")

        cursor.close()
        conn.close()
        print("PostgreSQL connection check passed successfully!")
        return True
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = create_database_if_not_exists()
    if not success:
        sys.exit(1)
