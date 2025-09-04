import json
from decimal import Decimal
from db import get_db_connection, close_db_connection, execute_query  # Import functions from your helper file

# Custom function to convert Decimal objects to float
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

# Function to fetch and compute user comparison stats
def fetch_user_comparison_stats(cursor, username1, username2):
    # Fetch user stats
    query = """
    SELECT username, rating, problem_count, max_rating
    FROM users
    WHERE username = %s OR username = %s
    """
    execute_query(cursor, query, (username1, username2))
    user_stats = {user[0]: {"rating": user[1], "problem_count": user[2], "max_rating": user[3]} for user in cursor.fetchall()}

    # Fetch total contests (without total rating change)
    contest_query = """
    SELECT username, COUNT(*) AS total_contests
    FROM user_contests
    WHERE username = %s OR username = %s
    GROUP BY username
    """
    execute_query(cursor, contest_query, (username1, username2))
    contest_data = {contest[0]: {"total_contests": contest[1]} for contest in cursor.fetchall()}

    # Combine data
    for username in [username1, username2]:
        if username in user_stats:
            user_stats[username].update(contest_data.get(username, {'total_contests': 0}))

    return user_stats

# Function to fetch common contests
def fetch_common_contests(cursor, username1, username2):
    query = """
    SELECT uc1.contest_id, c.contest_name, uc1.contest_rank AS user1_rank, uc2.contest_rank AS user2_rank
    FROM user_contests uc1
    JOIN user_contests uc2 ON uc1.contest_id = uc2.contest_id
    JOIN contests c ON uc1.contest_id = c.contest_id
    WHERE uc1.username = %s AND uc2.username = %s
    """
    execute_query(cursor, query, (username1, username2))
    return [{"contest_id": contest[0], "contest_name": contest[1], f"{username1}_rank": contest[2], f"{username2}_rank": contest[3]} for contest in cursor.fetchall()]

# Function to calculate average submissions per problem
def fetch_avg_submissions(cursor, username):
    query = """
    SELECT AVG(submissions_per_problem) AS avg_submissions
    FROM (
        SELECT COUNT(*) AS submissions_per_problem
        FROM submissions
        WHERE username = %s
        GROUP BY problem_id
    ) AS problem_submission_data
    """
    execute_query(cursor, query, (username,))
    result = cursor.fetchone()
    return result[0] if result else 0

# Function to fetch tags comparison
def fetch_tags_comparison(cursor, username1, username2):
    query = """
    SELECT pt.tag_id, t.tag_name, COUNT(DISTINCT s.problem_id) AS problem_count
    FROM problem_tags pt
    JOIN tags t ON pt.tag_id = t.tag_id
    JOIN submissions s ON pt.problem_id = s.problem_id
    WHERE s.username = %s
    GROUP BY pt.tag_id
    """
    execute_query(cursor, query, (username1,))
    tags_user1 = {tag[1]: tag[2] for tag in cursor.fetchall()}

    execute_query(cursor, query, (username2,))
    tags_user2 = {tag[1]: tag[2] for tag in cursor.fetchall()}

    return {f"{username1}": tags_user1, f"{username2}": tags_user2}

# Function to save data to a JSON file
def save_data_to_json(data, file_name="comparison_stats.json"):
    with open(file_name, 'w') as file:
        json.dump(data, file, indent=4, default=decimal_default)
    print(f"Data saved to {file_name}")

# Main function to fetch data from the database and store it in JSON
def main():
    username1 = "err_hexa"  # Replace with actual usernames
    username2 = "aru123"

    db, cursor = get_db_connection()

    # Fetch and compute data
    user_comparison_stats = fetch_user_comparison_stats(cursor, username1, username2)
    common_contests = fetch_common_contests(cursor, username1, username2)
    avg_submissions = {
        username1: fetch_avg_submissions(cursor, username1),
        username2: fetch_avg_submissions(cursor, username2)
    }
    tags_comparison = fetch_tags_comparison(cursor, username1, username2)

    # Combine all data
    all_data = {
        "user_comparison_stats": user_comparison_stats,
        "common_contests": common_contests,
        "avg_submissions": avg_submissions,
        "tags_comparison": tags_comparison
    }

    # Save data to JSON file
    save_data_to_json(all_data, 'comparison_stats.json')
    close_db_connection(db, cursor)

if __name__ == "__main__":
    main()
