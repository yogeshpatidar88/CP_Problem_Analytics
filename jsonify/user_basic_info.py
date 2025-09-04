import os
import json
from db import get_db_connection, close_db_connection, execute_query_2

def get_user_rating_title(rating):
    if rating < 1200:
        return "Newbie"
    elif rating < 1400:
        return "Pupil"
    elif rating < 1600:
        return "Specialist"
    elif rating < 1900:
        return "Expert"
    elif rating < 2100:
        return "Candidate Master"
    elif rating < 2300:
        return "Master"
    elif rating < 2400:
        return "International Master"
    elif rating < 2600:
        return "Grandmaster"
    elif rating < 3000:
        return "International Grandmaster"
    elif rating < 4000:
        return "Legendary Grandmaster"
    else:
        return "Tourist"

# Define the base path for user folders (works for both Windows and Linux)
base_path = os.path.join("users")  # Modify this base path if needed for Linux

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

# Get basic user information including total submissions
def get_user_basic_info(username):
    db, cursor = get_db_connection()
    try:
        # Query to fetch the basic user information
        query = """
            SELECT 
                username, 
                email, 
                rating, 
                country, 
                university, 
                problem_count, 
                max_rating, 
                rating_title
            FROM users
            WHERE username = %s;
        """
        
        print(f"Executing query: {query} with username: {username}")  # Debugging line

        execute_query_2(cursor, query, (username,), commit=False)  # Ensure commit is False for SELECT queries
        result = cursor.fetchone()

        if not result:
            print(f"No data found for username: {username}")  # Debugging line
            return

        # Query to fetch total number of submissions for the user
        query_submissions = """
            SELECT COUNT(*) 
            FROM submissions
            WHERE username = %s;
        """
        execute_query_2(cursor, query_submissions, (username,), commit=False)
        total_submissions = cursor.fetchone()[0]  # Fetch the count of submissions

        # Map the result to a dictionary
        data = {
            "username": result[0],
            "email": result[1],
            "rating": result[2],
            "country": result[3],
            "university": result[4],
            "problem_count": result[5],
            "max_rating": result[6],
            "rating_title": get_user_rating_title(result[2]),
            "total_submissions": total_submissions  # Add the total submissions here
        }

        # Format JSON with username as the key
        json_data = {username: data}

        # Save to JSON file
        save_to_json(f'{username}_basic_info.json', json_data, username)
        print("User basic information and total submissions saved to JSON file.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        close_db_connection(db, cursor)

# Main block to run the function
if __name__ == "__main__":
    username = "aru123"  # Replace with the desired username
    get_user_basic_info(username)