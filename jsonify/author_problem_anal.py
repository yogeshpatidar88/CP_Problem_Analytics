import os
import sys
import json
from decimal import Decimal
from db import get_db_connection, close_db_connection, execute_query, execute_query_2

# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Create folder dynamically based on OS
def get_save_path(filename):
    # Combine base folder with filename
    base_path = os.path.join("problem_analysis")
    os.makedirs(base_path, exist_ok=True)
    return os.path.join(base_path, filename)

# Feature 1: Problem Acceptance Rate (Percentage of Accepted Submissions)
def problem_acceptance_rate(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT 
            (SUM(CASE WHEN verdict = 'Accepted' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS acceptance_rate
        FROM submissions
        WHERE problem_id = %s
        """
        execute_query_2(cursor, query, (problem_id,))
        result = cursor.fetchone()

        return {"acceptance_rate": round(float(result[0]), 2) if result and result[0] is not None else 0}
    finally:
        close_db_connection(db, cursor)

# Feature 2: Common Errors on the Problem (Including Time Limit Exceeded)
def common_errors_on_problem(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT 
            verdict, 
            COUNT(*) AS error_count
        FROM submissions
        WHERE problem_id = %s
        GROUP BY verdict
        ORDER BY error_count DESC
        """
        execute_query_2(cursor, query, (problem_id,))
        errors = cursor.fetchall()

        return {
            "common_errors": [
                {
                    "verdict": error[0],
                    "error_count": error[1]
                }
                for error in errors
            ]
        }
    finally:
        close_db_connection(db, cursor)

# Feature 3: Difficulty Perception (Based on Submission Ratings)
def difficulty_perception(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT 
            AVG(u.rating) AS average_user_rating,
            COUNT(*) AS successful_submission_count
        FROM submissions s
        JOIN users u ON s.username = u.username
        WHERE s.problem_id = %s AND s.verdict IN ('Accepted', 'Correct')
        GROUP BY s.problem_id
        """
        execute_query_2(cursor, query, (problem_id,))
        result = cursor.fetchone()

        if result:
            # Prepare the output with average user rating and submission count
            return {
                "difficulty_perception": {
                    "average_user_rating": result[0],
                    "successful_submission_count": result[1]
                }
            }
        else:
            # If no data is found for the problem_id
            return {
                "difficulty_perception": {
                    "average_user_rating": None,
                    "successful_submission_count": 0
                }
            }
    finally:
        close_db_connection(db, cursor)
        
def get_actual_rating(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT diff_rating
        FROM problems
        WHERE problem_id = %s
        """
        execute_query_2(cursor, query, (problem_id,))
        result = cursor.fetchone()

        if result:
            # Return the actual difficulty rating of the problem
            return {
                "actual_rating": result[0]
            }
        else:
            # If the problem_id does not exist
            return {
                "actual_rating": None
            }
    finally:
        close_db_connection(db, cursor)


# Feature 4: User Interaction with the Problem (Unique users who attempted the problem)
def user_interaction_with_problem(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT COUNT(DISTINCT username) AS unique_users
        FROM submissions
        WHERE problem_id = %s
        """
        execute_query_2(cursor, query, (problem_id,))
        result = cursor.fetchone()

        return {"unique_user_interactions": result[0] if result and result[0] is not None else 0}
    finally:
        close_db_connection(db, cursor)

# Feature 5: Number of people who solved a problem by rating title
def submissions_by_user_rating_title(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT 
            u.rating_title, 
            COUNT(DISTINCT s.username) AS user_count
        FROM submissions s
        JOIN users u ON s.username = u.username
        WHERE s.problem_id = %s AND s.verdict = 'Accepted'
        GROUP BY u.rating_title
        ORDER BY user_count DESC
        """
        execute_query_2(cursor, query, (problem_id,))
        results = cursor.fetchall()

        return {
            "submissions_by_rating_title": [
                {
                    "rating_title": result[0],
                    "user_count": result[1]
                }
                for result in results
            ]
        }
    finally:
        close_db_connection(db, cursor)

# Feature 6: Average number of submissions to solve the problem
def average_submissions_to_solve(problem_id):
    db, cursor = get_db_connection()
    try:
        query = """
        SELECT 
            AVG(submission_count) AS avg_submissions
        FROM (
            SELECT 
                username, 
                COUNT(*) AS submission_count
            FROM submissions
            WHERE problem_id = %s
            GROUP BY username
            HAVING SUM(CASE WHEN verdict = 'Accepted' THEN 1 ELSE 0 END) > 0
        ) AS user_attempts
        """
        execute_query_2(cursor, query, (problem_id,))
        result = cursor.fetchone()

        return {"average_submissions_to_solve": round(float(result[0]), 2) if result and result[0] is not None else 0}
    finally:
        close_db_connection(db, cursor)

# Save all feature data to JSON
def save_prob_anal_json(data, filename):
    file_path = get_save_path(filename)
    with open(file_path, 'w') as json_file:
        json.dump(data, json_file, indent=4, cls=DecimalEncoder)
    return file_path

def convert_problem_id(problem_id):
    # Split the problem_id on the underscore and join the parts
    return problem_id


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 author_problem_anal.py <problem_id>")
        sys.exit(1)
    
    problem_id = sys.argv[1]
    # Call your existing functions to gather data
    data = {
        "problem_id": problem_id,
        "problem_difficulty_rating" : get_actual_rating(problem_id),
        "problem_acceptance_rate": problem_acceptance_rate(problem_id),
        "common_errors_on_problem": common_errors_on_problem(problem_id),
        "difficulty_perception": difficulty_perception(problem_id),
        "user_interaction_with_problem": user_interaction_with_problem(problem_id),
        "submissions_by_user_rating_title": submissions_by_user_rating_title(problem_id),
        "average_submissions_to_solve": average_submissions_to_solve(problem_id)
    }
    base_dir = "/run/media/arunav/Data/programming/DBIS_MAIN/Frontend/problem_analysis"
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)
    filename = f"{problem_id}_analysis.json"
    filename = os.path.join(base_dir, filename)
    save_prob_anal_json(data, filename)

# Example usage
if __name__ == "__main__":
    main()