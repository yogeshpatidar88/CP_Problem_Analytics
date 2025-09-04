# delete.py
import sys
from db import get_db_connection, close_db_connection

def delete_data():
    try:
        db, cursor = get_db_connection()
        
        # Start Transaction
        db.start_transaction()
        
        # Delete data from tables in the correct order
        tables = [
            "problem_tags",
            "tags",
            "submissions",
            "user_contests",
            "contest_authors",
            "problems",
            "contests",
            "users"
        ]
        
        for table in tables:
            cursor.execute(f"DELETE FROM {table}")
        
        # Commit Transaction
        db.commit()
        print("Data deleted successfully from all tables.")
    except Exception as e:
        # Rollback Transaction in case of error
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        close_db_connection(db, cursor)

if __name__ == "__main__":
    delete_data()