import mysql.connector
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from db import get_db_connection, close_db_connection, execute_query

# Fetch data from the database
def fetch_user_solved_problems(user_id):
    db, cursor = get_db_connection()

    # Get the last 10 solved problems for the user
    query = """
    SELECT p.problem_id, p.diff_rating, pt.tag_id
    FROM problems p
    JOIN problem_tags pt ON p.problem_id = pt.problem_id
    WHERE p.problem_id IN (
        SELECT problem_id
        FROM submissions
        WHERE username = %s AND verdict = 'Accepted'
    )
    ORDER BY (SELECT submission_time FROM submissions WHERE username = %s AND problem_id = p.problem_id LIMIT 1) DESC
    LIMIT 10;
    """
    cursor.execute(query, (user_id, user_id))
    user_problems = pd.DataFrame(cursor.fetchall(), columns=['problem_id', 'diff_rating', 'tag_id'])

    close_db_connection(db, cursor)
    return user_problems

def fetch_problems_within_range(base_rating, tag_ids, rating_range=10000):
    db, cursor = get_db_connection()

    # Fetch problems within the specified rating range and matching tags
    query = """
    SELECT p.problem_id, p.diff_rating, pt.tag_id
    FROM problems p
    JOIN problem_tags pt ON p.problem_id = pt.problem_id
    WHERE p.diff_rating BETWEEN %s AND %s
    AND pt.tag_id IN (%s)
    """
    rating_min = base_rating - rating_range
    rating_max = base_rating + rating_range
    tag_ids_str = ','.join([str(tag) for tag in tag_ids])

    cursor.execute(query, (rating_min, rating_max, tag_ids_str))
    problems = pd.DataFrame(cursor.fetchall(), columns=['problem_id', 'diff_rating', 'tag_id'])

    close_db_connection(db, cursor)
    return problems

# Build a KNN model for problem suggestion
def suggest_problems_knn(user_id, k=5):
    # Step 1: Fetch user's last 10 solved problems
    user_solved_problems = fetch_user_solved_problems(user_id)

    if user_solved_problems.empty:
        print("No solved problems found for this user.")
        return None

    # Step 2: Fetch all problems within ±100 rating of the user's problems
    tag_ids = user_solved_problems['tag_id'].unique()
    base_rating = user_solved_problems['diff_rating'].mean()
    candidate_problems = fetch_problems_within_range(base_rating, tag_ids)

    if candidate_problems.empty:
        print("No candidate problems found within the rating range and tags.")
        return None

    # Step 3: Prepare data for KNN
    candidate_features = candidate_problems[['diff_rating']].values
    user_features = user_solved_problems[['diff_rating']].mean().values.reshape(1, -1)

    # Step 4: Fit KNN model
    knn = NearestNeighbors(n_neighbors=k)
    knn.fit(candidate_features)

    # Step 5: Find k nearest problems
    distances, indices = knn.kneighbors(user_features)
    recommended_problems = candidate_problems.iloc[indices[0]]

    return recommended_problems

# Main function to execute the recommendation system
def main():
    user_id = 'anmoljoshicrx128'  # Replace with a valid username from your database
    recommendations = suggest_problems_knn(user_id)

    if recommendations is not None:
        print("Recommended Problems for User:", user_id)
        print(recommendations[['problem_id', 'diff_rating', 'tag_id']])

if __name__ == "__main__":
    main()
