import requests
import mysql.connector
from datetime import datetime

# Connect to the database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="T@nishq123",
    database="cpdbs"
)
cursor = db.cursor()

api_url = "https://codeforces.com/api/"

# Helper function to execute SQL query
def execute_query(query, values=None):
    cursor.execute(query, values)
    db.commit()
    
    
def get_contest_type(contest_name):
    if "Div. 1 + Div. 2" in contest_name:
        return "Div. 1 + Div. 2"
    elif "Div. 1" in contest_name:
        return "Div. 1"
    elif "Div. 2" in contest_name:
        return "Div. 2"
    elif "Div. 3" in contest_name:
        return "Div. 3"
    elif "Div. 4" in contest_name:
        return "Div. 4"
    elif "Educational" in contest_name:
        return "Educational"
    elif "CodeTON" in contest_name:
        return "CodeTON"
    elif "Global" in contest_name:
        return "Global"
    elif "Kotlin" in contest_name:
        return "Kotlin"
    elif "VK Cup" in contest_name:
        return "VK Cup"
    elif "Long Rounds" in contest_name:
        return "Long Rounds"
    elif "April Fools" in contest_name:
        return "April Fools"
    elif "Team Contest" in contest_name:
        return "Team Contests"
    elif "ICPC" in contest_name:
        return "ICPC Scoring"
    else:
        return "Other"

# Function to fetch and insert contest details
def fetch_and_insert_contest(contest_id):
    url = f"{api_url}contest.standings?contestId={contest_id}"
    response = requests.get(url)
    
    if response.status_code == 200:
        contest_info = response.json()
        if contest_info["status"] == "OK":
            contest_data = contest_info["result"]["contest"]
            query = """
            INSERT INTO contests (contest_id, contest_name, start_time, end_time, duration, contest_type)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                contest_name = VALUES(contest_name)
            """
            start_time = datetime.fromtimestamp(contest_data.get("startTimeSeconds", 0))
            end_time = datetime.fromtimestamp(contest_data.get("startTimeSeconds", 0) + contest_data.get("durationSeconds", 0))
            duration_hours = (end_time - start_time).total_seconds() / 3600  # Calculate duration in hours
            contest_type = get_contest_type(contest_data.get("name"))

            values = (
                contest_data.get("id"),
                contest_data.get("name", "Unknown Contest"),
                start_time,
                end_time,
                duration_hours,  # Duration in hours
                contest_type
            )
            execute_query(query, values)
    else:
        print(f"Failed to fetch contest details for contest_id {contest_id}. Status code: {response.status_code}")

# Function to fetch and insert problems for a given submission
def fetch_and_insert_problem(problem_info):
    if "contestId" in problem_info and "name" in problem_info:
        # First, fetch and insert the contest
        fetch_and_insert_contest(problem_info["contestId"])
        
        query = """
        INSERT INTO problems (problem_id, title, contest_id, diff_rating)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title)
        """
        values = (
            f"{problem_info['contestId']}_{problem_info['index']}",  # Combine contestId and index for unique problem ID
            problem_info.get("name", "Unnamed Problem"),  # Default name
            problem_info["contestId"],
            problem_info.get("rating", 800)  # Default to 800 if rating is not provided
        )
        execute_query(query, values)

# Function to fetch and insert user submissions
def fetch_and_insert_user_submissions(handle):
    url_status = f"{api_url}user.status?handle={handle}"
    response_status = requests.get(url_status)

    if response_status.status_code == 200:
        submissions = response_status.json()["result"]
        
        for submission in submissions:
            problem_info = submission["problem"]
            # print(problem_info)
            fetch_and_insert_problem(problem_info)  # Insert problem data first

            query = """
            INSERT INTO submissions (
                submission_id, problem_id, username, verdict, submission_time, execution_time, memory_used, language_used
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                verdict = VALUES(verdict),
                submission_time = VALUES(submission_time),
                execution_time = VALUES(execution_time),
                memory_used = VALUES(memory_used),
                language_used = VALUES(language_used)
            """
            values = (
                submission.get("id"),
                f"{problem_info['contestId']}_{problem_info['index']}",  # Use combined ID for problem_id
                handle,
                submission.get("verdict", "UNKNOWN"),
                datetime.fromtimestamp(submission.get("creationTimeSeconds", 0)),
                submission.get("timeConsumedMillis", 0),
                f"{submission.get('memoryConsumedBytes', 0) // 1024} KB",  # Convert bytes to KB, default to 0 if not provided
                submission.get("programmingLanguage", "UNKNOWN")
            )
            execute_query(query, values)
        
        print(f"Submissions for user {handle} added/updated successfully.")
    else:
        print(f"Failed to fetch submissions for user {handle}. Status code: {response_status.status_code}")

# List of user handles to process
user_handles = ["err_hexa", "aru123", "tanishqgodha"]

# Fetch and insert submissions for each user
for handle in user_handles:
    fetch_and_insert_user_submissions(handle)

# Close the database connection
cursor.close()
db.close()