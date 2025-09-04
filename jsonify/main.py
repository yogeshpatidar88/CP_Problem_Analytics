# jsonify/main.py
import sys
import os
import json
from db import get_db_connection, close_db_connection
from user import fetch_and_insert_user_details
from contests import fetch_and_insert_user_submissions
from user_contest import fill_user_contest
from user_analysis import (
    get_contest_cards,
    get_contest_count_and_best_rank,
    get_user_rating_history
)
from problem_anal import (
    process_user_data_and_save,
    get_problem_count_by_rating,
    get_user_submissions_by_verdict,
    get_monthly_problem_count,
    save_last_10_submissions,
    get_unsolved_problems
)
from user_basic_info import get_user_basic_info

def main(username, email, hashed_password):
    try:
        db, cursor = get_db_connection()
        print("Database connection established.")

        # Start Transaction
        db.start_transaction()
        print("Transaction started.")

        # Insert User Details
        fetch_and_insert_user_details(cursor, db, username, email, hashed_password)
        print("User details inserted.")

        # Insert User Submissions
        fetch_and_insert_user_submissions(cursor, db, username, count=10)
        print("User submissions inserted.")

        # Fill User Contest Information
        fill_user_contest(username)
        print("User contest information filled.")

        # Analyze User Data
        rating_history = get_user_rating_history(username)
        print("User rating history retrieved.")

        basic_info = get_user_basic_info(username)
        print("User basic information retrieved.")

        contest_cards = get_contest_cards(username)
        print("Contest cards generated.")

        contest_count_best_rank = get_contest_count_and_best_rank(username)
        print("Contest count and best rank calculated.")

        process_user_data_and_save(username)
        print("User data processed and saved.")

        problem_count_by_rating = get_problem_count_by_rating(username)
        print("Problem count by rating calculated.")

        user_submissions = get_user_submissions_by_verdict(username)
        print("User submissions by verdict analyzed.")

        monthly_problem_count = get_monthly_problem_count(username)
        print("Monthly problem count calculated.")

        last_submissions = save_last_10_submissions(username)
        print("Last 10 submissions saved.")

        unsolved_problems = get_unsolved_problems(username)
        print(f"Unsolved problems for {username}: {unsolved_problems}")

        # Commit Transaction
        db.commit()
        print("Transaction committed successfully.")

        # Export JSON files to /jsonify/users/<username>/
        export_json_files(username, {
            "user_data": {
                "username": username,
                "email": email
                # Add other relevant user data fields if necessary
            },
            "basic_info": basic_info,
            "rating_history": rating_history,
            "problem_count_by_rating": problem_count_by_rating,
            "contest_cards": contest_cards,
            "contest_count_best_rank": contest_count_best_rank,
            "user_submissions_by_verdict": user_submissions,
            "monthly_problem_count": monthly_problem_count,
            "last_submissions": last_submissions,
            "unsolved_problems": unsolved_problems
        })

        print("All operations completed successfully.")

    except Exception as e:
        # Rollback Transaction in case of error
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        close_db_connection(db, cursor)
        print("Database connection closed.")

def export_json_files(username, data):
    try:
        user_directory = os.path.join(os.path.dirname(__file__), 'users', username)
        submissions_directory = os.path.join(user_directory, 'submissions')
        os.makedirs(submissions_directory, exist_ok=True)
        print(f"Created directories: {user_directory} and {submissions_directory}")

        # Export User Data
        with open(os.path.join(user_directory, f"{username}_data.json"), 'w') as f:
            json.dump(data["user_data"], f, indent=4)
            print(f"Exported user data to {username}_data.json")
        
        with open(os.path.join(user_directory, f"{username}_basic_info.json"), 'w') as f:
            json.dump(data["basic_info"], f, indent=4)
            print(f"Exported user data to {username}_basic_info.json")
        
        # Export User Rating History
        with open(os.path.join(user_directory, f"{username}_user_rating_history.json"), 'w') as f:
            json.dump(data["rating_history"], f, indent=4)
            print(f"Exported rating history to {username}_user_rating_history.json")

        # Export Problem Count by Rating
        with open(os.path.join(user_directory, f"{username}_problem_count_by_rating.json"), 'w') as f:
            json.dump(data["problem_count_by_rating"], f, indent=4)
            print(f"Exported problem count by rating to {username}_problem_count_by_rating.json")

        # Export Contest Cards
        with open(os.path.join(user_directory, f"{username}_contest_cards.json"), 'w') as f:
            json.dump(data["contest_cards"], f, indent=4)
            print(f"Exported contest cards to {username}_contest_cards.json")

        # Export Contest Count and Best Rank
        with open(os.path.join(user_directory, f"{username}_contest_count_best_rank.json"), 'w') as f:
            json.dump(data["contest_count_best_rank"], f, indent=4)
            print(f"Exported contest count and best rank to {username}_contest_count_best_rank.json")

        # Export User Submissions by Verdict
        with open(os.path.join(user_directory, f"{username}_user_submissions_by_verdict.json"), 'w') as f:
            json.dump(data["user_submissions_by_verdict"], f, indent=4)
            print(f"Exported user submissions by verdict to {username}_user_submissions_by_verdict.json")

        # Export Monthly Problem Count
        with open(os.path.join(user_directory, 'monthly_problem_count.json'), 'w') as f:
            json.dump(data["monthly_problem_count"], f, indent=4)
            print(f"Exported monthly problem count to monthly_problem_count.json")

        # Export Last 10 Submissions
        with open(os.path.join(submissions_directory, f"{username}_last_10_submissions.json"), 'w') as f:
            json.dump(data["last_submissions"], f, indent=4)
            print(f"Exported last 10 submissions to {username}_last_10_submissions.json")

        # Export Unsolved Problems
        with open(os.path.join(user_directory, f"{username}_unsolved_problems.json"), 'w') as f:
            json.dump(data["unsolved_problems"], f, indent=4)
            print(f"Exported unsolved problems to {username}_unsolved_problems.json")

    except Exception as e:
        print(f"Error exporting JSON files: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python jsonify/main.py <username> <email> <hashed_password>", file=sys.stderr)
        sys.exit(1)
    username = sys.argv[1]
    email = sys.argv[2]
    hashed_password = sys.argv[3]
    main(username, email, hashed_password)