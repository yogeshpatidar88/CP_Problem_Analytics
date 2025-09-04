import requests
from datetime import datetime
from db import execute_query

api_url = "https://codeforces.com/api/"

def get_contest_type(contest_name):
    types = ["Div. 1", "Div. 2", "Div. 3", "Div. 4", "Educational", "CodeTON", "Global", "Kotlin", "VK Cup", "Long Rounds", "April Fools", "Team Contests", "ICPC Scoring"]
    for t in types:
        if t in contest_name:
            return t
    return "Other"

def get_last_updated_time(cursor, handle):
    query = "SELECT last_updated FROM users WHERE username = %s"
    cursor.execute(query, (handle,))
    result = cursor.fetchone()
    return result[0] if result else None

def update_last_updated_time(cursor, db, handle, last_submission_time):
    query = "UPDATE users SET last_updated = %s WHERE username = %s"
    execute_query(cursor, query, (last_submission_time, handle))
    db.commit()

def fetch_and_insert_contest(cursor, db, contest_id):
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
            duration = str(contest_data.get("durationSeconds") // 60) + " minutes"
            contest_type = get_contest_type(contest_data.get("name"))

            values = (
                contest_data.get("id"),
                contest_data.get("name", "Unknown Contest"),
                start_time,
                end_time,
                duration,
                contest_type
            )
            execute_query(cursor, query, values)
            db.commit()
    else:
        print(f"Failed to fetch contest details for contest_id {contest_id}. Status code: {response.status_code}")

def fetch_and_insert_problem(cursor, db, problem_info):
    if "contestId" in problem_info and "name" in problem_info:
        fetch_and_insert_contest(cursor, db, problem_info["contestId"])
        
        # Insert the problem into the problems table
        query = """
        INSERT INTO problems (problem_id, title, contest_id, diff_rating)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title)
        """
        values = (
            f"{problem_info['contestId']}_{problem_info['index']}",  
            problem_info.get("name", "Unnamed Problem"),
            problem_info["contestId"],
            problem_info.get("rating", 800)
        )
        execute_query(cursor, query, values)
        db.commit()
        
        # Insert tags into the tags table and problem_tags table
        if "tags" in problem_info:
            for tag in problem_info["tags"]:
                # Insert the tag into the tags table if it does not exist
                tag_query = """
                INSERT IGNORE INTO tags (tag_name)
                VALUES (%s)
                """
                execute_query(cursor, tag_query, (tag,))
                db.commit()
                
                # Get the tag_id, with a check for None
                cursor.execute("SELECT tag_id FROM tags WHERE tag_name = %s", (tag,))
                tag_result = cursor.fetchone()
                
                if tag_result is not None:
                    tag_id = tag_result[0]
                    # Insert into problem_tags table
                    problem_tag_query = """
                    INSERT IGNORE INTO problem_tags (problem_id, tag_id)
                    VALUES (%s, %s)
                    """
                    execute_query(cursor, problem_tag_query, (f"{problem_info['contestId']}_{problem_info['index']}", tag_id))
                    db.commit()
                else:
                    print(f"Warning: Tag '{tag}' could not be found in the database.")


def fetch_and_insert_user_submissions(cursor, db, handle, count=1000000):
    last_updated_time = get_last_updated_time(cursor, handle)

    url_status = f"{api_url}user.status?handle={handle}"
    response_status = requests.get(url_status)

    if response_status.status_code == 200:
        submissions = response_status.json()["result"]
        
        if last_updated_time:
            submissions = [s for s in submissions if datetime.fromtimestamp(s["creationTimeSeconds"]) > last_updated_time]

        submissions = submissions[:min(count, len(submissions))]

        for submission in submissions:
            problem_info = submission["problem"]
            fetch_and_insert_problem(cursor, db, problem_info)

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
                f"{problem_info['contestId']}_{problem_info['index']}",
                handle,
                "Accepted" if submission.get("verdict", "UNKNOWN") == "OK" else submission.get("verdict", "UNKNOWN"),
                datetime.fromtimestamp(submission.get("creationTimeSeconds", 0)),
                submission.get("timeConsumedMillis", 0),
                f"{submission.get('memoryConsumedBytes', 0) // 1024} KB",
                submission.get("programmingLanguage", "UNKNOWN")
            )
            execute_query(cursor, query, values)
            db.commit()

        if submissions:
            last_submission_time = datetime.fromtimestamp(submissions[0]["creationTimeSeconds"])
            update_last_updated_time(cursor, db, handle, last_submission_time)

        print(f"Submissions for user {handle} added/updated successfully.")
    else:
        print(f"Failed to fetch submissions for user {handle}. Status code: {response_status.status_code}")


# Call this function once during initialization to populate the tags table

