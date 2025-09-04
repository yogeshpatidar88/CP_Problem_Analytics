import mysql.connector
import json
import os
from mysql.connector import Error
from datetime import datetime

# Database configuration
db_config = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "279936",
    "database": "cpdbs"
}

# Define the base path for user folders (works for both Windows and Linux)
base_path = os.path.join("users")  # Modify this base path if needed for Linux

# Function to get database connection
def get_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except Error as e:
        print(f"Error: {e}")
        return None

# Convert MySQL datetime to string format
def mysql_datetime_to_str(mysql_datetime):
    if mysql_datetime:
        return mysql_datetime.strftime('%Y-%m-%d %H:%M:%S')
    return None

# Ensure the user folder exists
def ensure_user_folder_exists(username):
    user_folder = os.path.join(base_path, username)
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)
    return user_folder

# Save the data to a JSON file inside the user's folder
def save_to_json(filename, data, username):
    user_folder = ensure_user_folder_exists(username)
    filepath = os.path.join(user_folder, filename)
    with open(filepath, 'w') as json_file:
        json.dump(data, json_file, indent=4)

# Get contest count and best rank for a user
def get_contest_count_and_best_rank(username):
    db = get_db_connection()
    if db is None:
        return

    try:
        cursor = db.cursor(dictionary=True)
        
        # SQL query to get contest count, best rank, and worst rank
        query = """
            SELECT 
                COUNT(DISTINCT uc.contest_id) AS contest_count,  -- Count distinct contests to avoid double counting
                (SELECT uc.contest_id
                 FROM user_contests uc
                 WHERE uc.username = %s
                 ORDER BY uc.contest_rank
                 LIMIT 1) AS best_rank_contest_id,
                (SELECT MIN(uc.contest_rank)
                 FROM user_contests uc
                 WHERE uc.username = %s) AS best_rank,
                (SELECT uc.contest_id
                 FROM user_contests uc
                 WHERE uc.username = %s
                 ORDER BY uc.contest_rank DESC
                 LIMIT 1) AS worst_rank_contest_id,
                (SELECT MAX(uc.contest_rank)
                 FROM user_contests uc
                 WHERE uc.username = %s) AS worst_rank
            FROM user_contests uc
            WHERE uc.username = %s;
        """
        
        cursor.execute(query, (username, username, username, username, username))
        data = cursor.fetchall()

        for entry in data:
            entry['contest_count'] = int(entry['contest_count'])
            entry['best_rank'] = int(entry['best_rank']) if entry['best_rank'] is not None else None
            entry['worst_rank'] = int(entry['worst_rank']) if entry['worst_rank'] is not None else None
            entry['best_rank_contest_id'] = entry['best_rank_contest_id'] if entry['best_rank_contest_id'] is not None else None
            entry['worst_rank_contest_id'] = entry['worst_rank_contest_id'] if entry['worst_rank_contest_id'] is not None else None

        # Save the data to a JSON file
        save_to_json(f'{username}_contest_count_best_rank.json', data, username)
        print(f"Contest count, best rank, and worst rank saved to {username}_contest_count_best_rank.json")
    
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    
    finally:
        cursor.close()
        db.close()



# Get user rating history
def get_user_rating_history(username):
    db = get_db_connection()
    if db is None:
        return

    try:
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT 
                c.start_time AS contest_date, 
                c.contest_name, 
                uc.rating_change, 
                uc.final_rating AS final_rating
            FROM user_contests uc
            JOIN contests c ON uc.contest_id = c.contest_id
            JOIN users u ON uc.username = u.username
            WHERE uc.username = %s
            ORDER BY c.start_time;
        """
        cursor.execute(query, (username,))
        data = cursor.fetchall()

        # Convert contest_date to string format
        for entry in data:
            entry['contest_date'] = mysql_datetime_to_str(entry['contest_date'])
            entry['rating_change'] = int(entry['rating_change']) if entry['rating_change'] is not None else None
            entry['final_rating'] = int(entry['final_rating']) if entry['final_rating'] is not None else None

        # Remove duplicates based on contest_date and contest_name
        seen = set()
        unique_data = []
        for entry in data:
            identifier = (entry['contest_date'], entry['contest_name'])
            if identifier not in seen:
                unique_data.append(entry)
                seen.add(identifier)

        save_to_json(f'{username}_user_rating_history.json', unique_data, username)
        print("User rating history saved to user_rating_history.json")
    except Error as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        db.close()

# Get contest cards for a user
def get_contest_cards(username):
    db = get_db_connection()
    if db is None:
        return

    try:
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT 
                c.contest_name, 
                uc.contest_rank, 
                uc.rating_change, 
                uc.penalty,
                (SELECT COUNT(DISTINCT s.problem_id) 
                FROM submissions s 
                JOIN problems p ON s.problem_id = p.problem_id
                WHERE s.username = uc.username AND p.contest_id = uc.contest_id) AS problems_solved
            FROM 
                user_contests uc
            JOIN 
                contests c ON uc.contest_id = c.contest_id
            WHERE 
                uc.username = %s;
        """
        cursor.execute(query, (username,))
        data = cursor.fetchall()

        # Remove duplicates based on 'contest_name'
        unique_data = []
        seen_contests = set()
        for entry in data:
            contest_name = entry['contest_name']
            if contest_name not in seen_contests:
                unique_data.append(entry)
                seen_contests.add(contest_name)

        # Save unique data to a JSON file
        save_to_json(f'{username}_contest_cards.json', unique_data, username)
        print("Contest cards saved to contest_cards.json")
    except Error as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        db.close()

# Main block to run the functions
if __name__ == "__main__":
    username = "aru123"  # Replace with the desired username
    get_contest_count_and_best_rank(username)
    get_user_rating_history(username)
    get_contest_cards(username)
