import requests
from datetime import datetime
from db import execute_query

api_url = "https://codeforces.com/api/"

def get_last_update_time(cursor):
    query = "SELECT MAX(last_updated) FROM users"
    cursor.execute(query)
    result = cursor.fetchone()
    return result[0] if result[0] else datetime(1970, 1, 1)  # default to epoch if no records

def fetch_user_contests(user_handle, last_update):
    url = f"{api_url}user.rating?handle={user_handle}"
    response = requests.get(url)
    if response.status_code == 200:
        contests = response.json()["result"]
        # Filter contests based on the last update time
        recent_contests = [
            (contest["contestId"], contest["ratingUpdateTimeSeconds"])
            for contest in contests if datetime.fromtimestamp(contest["ratingUpdateTimeSeconds"]) > last_update
        ]
        return recent_contests
    else:
        print(f"Failed to fetch contests for user {user_handle}. Status code: {response.status_code}")
        return []

def insert_user_contests(cursor, db, username, contests):
    query = """
    INSERT INTO user_contests (username, contest_id)
    VALUES (%s, %s)
    """
    for contest_id, _ in contests:
        execute_query(cursor, query, (username, contest_id))
    db.commit()
    print(f"Inserted/Updated contests for username {username}.")

def update_user_contests(cursor, db, handle):
    last_update = get_last_update_time(cursor)
    contest = fetch_user_contests(handle, last_update)
    if contest:
        insert_user_contests(cursor, db, handle, contest)

# Example usage
# Assume `users` is a list of tuples (username, user_handle)
# users = [(1, 'user_handle1'), (2, 'user_handle2'), ...]

# cursor and db should be created using your database connection
# update_user_contests(cursor, db, users)
