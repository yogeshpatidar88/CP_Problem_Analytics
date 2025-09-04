import requests
import mysql.connector
from datetime import datetime, timedelta

# Connect to your database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="T@nishq123",
    database="cpdbs"
)
cursor = db.cursor()

# Codeforces API base URL
api_url = "https://codeforces.com/api/"

# Helper function to execute queries
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

# Fetch recent contests from the last 10 days
def fetch_and_insert_contests():
    url = f"{api_url}contest.list"
    response = requests.get(url)
    if response.status_code == 200:
        contests = response.json()["result"]
        cutoff_date = datetime.now() - timedelta(days=10)
        
        for i,contest in enumerate(contests):
            start_time = datetime.fromtimestamp(contest["startTimeSeconds"])
            relative_time = int(contest["relativeTimeSeconds"])
            
      
            if start_time >= cutoff_date and relative_time > 0:
                print(i, relative_time)
                query = """
                INSERT IGNORE INTO contests (contest_id, contest_name, start_time, end_time, duration, contest_type)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                duration = str(contest["durationSeconds"] // 60) + " minutes"
                end_time = start_time + timedelta(seconds=contest["durationSeconds"])
                contest_type = get_contest_type(contest["name"])
                values = (
                    contest["id"],
                    contest["name"],
                    start_time,
                    end_time,
                    duration,
                    contest_type
                )
                execute_query(query, values)
                
            if start_time< cutoff_date:
                break

fetch_and_insert_contests()

# Close the database connection
cursor.close()
db.close()