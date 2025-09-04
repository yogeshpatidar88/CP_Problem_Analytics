from db import get_db_connection , close_db_connection

db, cursor = get_db_connection()
cursor.execute("SELECT username FROM users;")
all_usernames = cursor.fetchall()
print(f"All usernames in the database: {all_usernames}")
close_db_connection(db, cursor)
