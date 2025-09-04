import mysql.connector

def get_db_connection():
    db = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="279936",
        database="cpdbs"  # Replace with your database name
    )
    cursor = db.cursor(buffered=True)
    return db, cursor

def close_db_connection(db, cursor):
    cursor.close()
    db.close()

def execute_query(cursor, query, values=None, commit=True):
    try:
        if values:
            # Check if 'values' is a list of tuples for batch inserts
            if isinstance(values, list) and all(isinstance(v, tuple) for v in values):
                cursor.executemany(query, values)
            else:
                cursor.execute(query, values)
        else:
            cursor.execute(query)

        if cursor.with_rows:
            # Ensure all rows are consumed if it's a SELECT query
            cursor.fetchall()

        if commit:
            cursor._connection.commit()  # Commit the transaction
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        try:
            cursor._connection.rollback()  # Rollback on error
        except mysql.connector.Error as rollback_err:
            print(f"Rollback failed: {rollback_err}")
        raise  # Re-raise the error to handle it upstream
    
def execute_query_2(cursor, query, values=None, commit=True):
    try:
        if values:
            if isinstance(values, list) and all(isinstance(v, tuple) for v in values):
                cursor.executemany(query, values)
            else:
                cursor.execute(query, values)
        else:
            cursor.execute(query)

        if commit:
            cursor._connection.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        try:
            cursor._connection.rollback()
        except mysql.connector.Error as rollback_err:
            print(f"Rollback failed: {rollback_err}")
        raise

