import datetime
import mysql.connector
import os
import json
import numpy as np
from db import get_db_connection, close_db_connection, execute_query,execute_query_2  # Import functions from your helper file


base_path = os.path.join("users") 

def get_user_submissions(username):
    db, cursor = get_db_connection()
    cursor = db.cursor(dictionary=True)  # Make sure cursor is dictionary-enabled here
    try:
        query = """
        SELECT s.problem_id, s.verdict, p.diff_rating AS rating
        FROM submissions s
        JOIN problems p ON s.problem_id = p.problem_id
        WHERE s.username = %s
        """
        cursor.execute(query, (username,))
        submissions = cursor.fetchall()  # Now submissions will be a list of dictionaries
    except mysql.connector.Error as err:
        db.rollback()  # Rollback transaction on error
        print(f"Error: {err}")
        raise
    finally:
        close_db_connection(db, cursor)  # Always close the cursor and connection
    
    return submissions


def get_user_problem_tags(username):
    db, cursor = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        query = """
        SELECT t.tag_name, COUNT(DISTINCT s.problem_id) AS problem_count
        FROM submissions s
        JOIN problems p ON s.problem_id = p.problem_id
        JOIN problem_tags pt ON p.problem_id = pt.problem_id
        JOIN tags t ON pt.tag_id = t.tag_id
        WHERE s.username = %s AND s.verdict = 'Accepted'
        GROUP BY t.tag_name
        ORDER BY problem_count DESC
        """
        cursor.execute(query, (username,))
        tag_counts = cursor.fetchall()
        print(tag_counts)
    except mysql.connector.Error as err:
        db.rollback()  # Rollback transaction in case of error
        print(f"Error: {err}")
        raise
    finally:
        close_db_connection(db, cursor)
    
    return {tag["tag_name"]: tag["problem_count"] for tag in tag_counts}

def save_data_to_json(data, username, filename):
    # Define the base directory for user data
    base_dir = os.path.join("users", username)  # Platform-independent path
    os.makedirs(base_dir, exist_ok=True)  # Create the directory if it does not exist

    # Full path for the file
    file_path = os.path.join(base_dir, filename)

    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)
    print(f"Data saved to {file_path}")
    return file_path

def process_user_data_and_save(username):
    submissions = get_user_submissions(username)
    problem_count = 0
    first_attempt_solved = 0
    solved_problems = set()
    problem_ratings = []
    problem_attempts = {}

    for submission in submissions:
        problem_id = submission['problem_id']
        
        if problem_id not in problem_attempts:
            problem_attempts[problem_id] = {'solved': False, 'failed': 0}
        
        if submission['verdict'] == 'Accepted':
            if problem_attempts[problem_id]['failed'] == 0 and not problem_attempts[problem_id]['solved']:
                first_attempt_solved += 1
                problem_attempts[problem_id]['solved'] = True

            problem_rating = submission['rating']
            if problem_rating is not None:
                problem_ratings.append(problem_rating)

            if problem_id not in solved_problems:
                solved_problems.add(problem_id)
                problem_count += 1

        elif submission['verdict'] != 'OK':
            problem_attempts[problem_id]['failed'] += 1

    avg_rating = np.mean(problem_ratings) if problem_ratings else 0
    highest_rating = max(problem_ratings) if problem_ratings else 0
    first_attempt_percentage = (first_attempt_solved / problem_count) * 100 if problem_count else 0

    problem_tags_count = get_user_problem_tags(username)

    data = {
        "username": username,
        "problem_count": problem_count,
        "average_rating": avg_rating,
        "highest_rating": highest_rating,
        "first_attempt_percentage": first_attempt_percentage,
        "problem_tags_count": problem_tags_count
    }

    # Save results to a JSON file inside users/user_handle
    filename = f"{username}_data.json"
    save_data_to_json(data, username, filename)

    return data

def get_problem_count_by_rating(username):
    db, cursor = get_db_connection()  # Unpack connection and cursor correctly

    if db is None:
        return

    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
            SELECT 
                p.diff_rating, 
                COUNT(s.problem_id) AS solved_count
            FROM submissions s
            JOIN problems p ON s.problem_id = p.problem_id
            WHERE s.username = %s AND s.verdict = 'Accepted'
            GROUP BY p.diff_rating
            ORDER BY p.diff_rating;
        """
        cursor.execute(query, (username,))
        results = cursor.fetchall()

        # Create user-specific folder if it doesn't exist
        base_dir = os.path.join("users", username)  # Platform-independent path
        os.makedirs(base_dir, exist_ok=True)  # Create directory if it doesn't exist

        # Save results to a JSON file inside users/user_handle
        file_path = os.path.join(base_dir, f"{username}_problem_count_by_rating.json")
        with open(file_path, 'w') as json_file:
            json.dump(results, json_file, indent=4)

        print(f"Problem count by rating saved to {file_path}")

    except mysql.connector.Error as e:
        db.rollback()  # Rollback transaction in case of error
        print(f"Error: {e}")
        raise
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()

def get_user_submissions_by_verdict(username):
    db, cursor = get_db_connection()  # Unpack connection and cursor correctly
    
    if db is None:
        return
    
    try:
        cursor = db.cursor(dictionary=True)
        
        # Query to get the count of problems solved per verdict type
        query = """
            SELECT s.verdict, COUNT(DISTINCT s.problem_id) AS problem_count
            FROM submissions s
            WHERE s.username = %s
            GROUP BY s.verdict
        """
        cursor.execute(query, (username,))
        results = cursor.fetchall()

        # Prepare the verdict count data
        verdict_count = {
            "Accepted": 0,
            "Wrong Answer": 0,
            "Time Limit Exceeded": 0,
            "Others": 0  # You can add more verdict types as needed
        }

        # Process the results and map them to the verdict count
        for result in results:
            verdict = result['verdict']
            if verdict in verdict_count:
                verdict_count[verdict] = result['problem_count']
            else:
                verdict_count["Others"] += result['problem_count']

        # Save the results to a JSON file
        file_path = save_data_to_json(verdict_count, username, "submissions_by_verdict.json")
        
        print(f"Problem counts by verdict saved to {file_path}")
        
        return verdict_count

    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()
            
def get_monthly_problem_count(username):
    db, cursor = get_db_connection()
    
    if db is None:
        return
    
    try:
        cursor = db.cursor(dictionary=True)
        
        # SQL query to count problems solved by the user, grouped by month and year
        query = """
            SELECT 
                YEAR(s.submission_time) AS year,
                MONTH(s.submission_time) AS month,
                COUNT(DISTINCT s.problem_id) AS problem_count
            FROM submissions s
            WHERE s.username = %s AND s.verdict = 'Accepted'
            GROUP BY YEAR(s.submission_time), MONTH(s.submission_time)
            ORDER BY year, month;
        """
        
        cursor.execute(query, (username,))
        results = cursor.fetchall()
        
        # Prepare data for saving
        monthly_data = []
        for result in results:
            monthly_data.append({
                "year": result["year"],
                "month": result["month"],
                "problem_count": result["problem_count"]
            })
        
        # Save the monthly data to a JSON file
        file_path = save_data_to_json(monthly_data, username, "monthly_problem_count.json")
        
        print(f"Monthly problem count data saved to {file_path}")
        
        return monthly_data
    
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        if cursor is not None:
            cursor.close()
        if db is not None:
            db.close()
            
        

def get_last_10_submissions(username):
    db, cursor = get_db_connection()
    
    query = """
    SELECT s.submission_id, s.problem_id, s.username, s.verdict, s.execution_time, 
           s.memory_used, s.language_used, p.title AS problem_title, 
           p.diff_rating, c.contest_name
    FROM submissions s
    JOIN problems p ON s.problem_id = p.problem_id
    JOIN contests c ON p.contest_id = c.contest_id
    WHERE s.username = %s
    ORDER BY s.submission_time DESC
    LIMIT 10;
    """

    try:
        execute_query_2(cursor, query, (username,))
        submissions = cursor.fetchall()
        
        # Convert the result to a dictionary format {problem_title: {submission details}}
        submissions_dict = {
            submission[7]: {  # Using `problem_title` as the key
                "submission_id": submission[0],
                "problem_id": submission[1],
                "username": submission[2],
                "verdict": submission[3],
                "execution_time": submission[4],
                "memory_used": submission[5],
                "language_used": submission[6],
                "diff_rating": submission[8],
                "contest_name": submission[9]
            }
            for submission in submissions
        }

    except mysql.connector.Error as e:
        print(f"Error: {e}")
        submissions_dict = {}
    finally:
        close_db_connection(db, cursor)
    
    return submissions_dict


# Function to save the last 10 submissions into a JSON file
def save_last_10_submissions(username):
    submissions = get_last_10_submissions(username)
    base_dir = os.path.join("users", username, "submissions")
    os.makedirs(base_dir, exist_ok=True)  # Create directory if it doesn't exist

    # Save the submissions into a JSON file
    filename = os.path.join(base_dir, f"{username}_last_10_submissions.json")
    with open(filename, "w") as f:
        json.dump(submissions, f, indent=4)
    
    print(f"Last 10 submissions saved to {filename}")
    return filename


def get_unsolved_problems(username):
    db, cursor = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:
        db.start_transaction()  # Start the transaction

        # Query to select problem IDs where the user submitted but did not get Accepted or OK verdicts
        query = """
            SELECT s.problem_id
            FROM submissions s
            WHERE s.username = %s
            AND s.verdict NOT IN ('Accepted', 'OK')
            AND NOT EXISTS (
                SELECT 1
                FROM submissions s2
                WHERE s2.username = s.username
                    AND s2.problem_id = s.problem_id
                    AND s2.verdict = 'Accepted'
            )
            GROUP BY s.problem_id;
        """

        cursor.execute(query, (username,))
        unsolved_problems = cursor.fetchall()
        
        db.commit()  # Commit the transaction if no error occurs
    except mysql.connector.Error as err:
        db.rollback()  # Rollback in case of error
        print(f"Error: {err}. Transaction rolled back.")
        unsolved_problems = []
    finally:
        close_db_connection(db, cursor)
    
    # Create a list of unsolved problem IDs
    unsolved_problem_ids = [problem['problem_id'] for problem in unsolved_problems]

    # Create user-specific folder if it doesn't exist
    base_dir = os.path.join("users", username)  # Platform-independent path
    os.makedirs(base_dir, exist_ok=True)  # Create directory if it doesn't exist

    # Save unsolved problem IDs to a JSON file inside users/user_handle
    file_path = os.path.join(base_dir, f"{username}_unsolved_problems.json")
    with open(file_path, 'w') as json_file:
        json.dump(unsolved_problem_ids, json_file, indent=4)

    print(f"Unsolved problems saved to {file_path}")

    return unsolved_problem_ids

            
            

def main():
    username = "err_hexa"  
    # user_data = process_user_data_and_save(username)
    # print(f"User ID: {user_data['username']}")
    # print(f"Problem Count: {user_data['problem_count']}")
    # print(f"Average Rating of Problems Solved: {user_data['average_rating']:.2f}")
    # print(f"Highest Rating of Problems Solved: {user_data['highest_rating']}")
    # print(f"First Attempt Success Percentage: {user_data['first_attempt_percentage']:.2f}%")
    
    # verdict_data = get_user_submissions_by_verdict(username)
    # print("Submissions by Verdict:")
    # for verdict, count in verdict_data.items():
    #     print(f"{verdict}: {count}")
    print(get_user_problem_tags(username))
    

if __name__ == "__main__":
    main()