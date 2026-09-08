import sys
import os
from sqlalchemy import inspect

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.core.database import engine

def verify_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("=" * 60)
    print(f"DATABASE TABLES VERIFICATION ({len(tables)} tables found)")
    print("=" * 60)
    for table in sorted(tables):
        columns = inspector.get_columns(table)
        fks = inspector.get_foreign_keys(table)
        pk = inspector.get_pk_constraint(table)
        print(f"Table: {table}")
        print(f"  - Columns ({len(columns)}): {', '.join([c['name'] for c in columns])}")
        print(f"  - Primary Key: {pk.get('constrained_columns', [])}")
        if fks:
            fk_strs = [f"{fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}" for fk in fks]
            print(f"  - Foreign Keys: {', '.join(fk_strs)}")
        print("-" * 60)

if __name__ == "__main__":
    verify_tables()
