# sql_scripts/main.py
import sys
from db import get_db_connection, close_db_connection
from user import fetch_and_insert_user_details
from contests import fetch_and_insert_user_submissions

def main(username, email, hashed_password):
    try:
        db, cursor = get_db_connection()
        print("Database connection established.")

        # Start Transaction
        db.start_transaction()
        print("Transaction started.")

        # Insert User Details
        fetch_and_insert_user_details(cursor, db, username, email, hashed_password)
        print("User details inserted.")

        # Insert User Submissions
        fetch_and_insert_user_submissions(cursor, db, username, count=10)
        print("User submissions inserted.")

        # Commit Transaction
        db.commit()
        print("Transaction committed successfully.")
        print("Database operations completed successfully.")
    except Exception as e:
        # Rollback Transaction in case of error
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        close_db_connection(db, cursor)
        print("Database connection closed.")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python main.py <username> <email> <hashed_password>", file=sys.stderr)
        sys.exit(1)
    username = sys.argv[1]
    email = sys.argv[2]
    hashed_password = sys.argv[3]
    main(username, email, hashed_password)