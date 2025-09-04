import mysql.connector
from db import get_db_connection, close_db_connection, execute_query

def label_data():
    # Connect to the database
    db, cursor = get_db_connection()
      
    fetch_data_query = """
    SELECT 
        c.contest_id,
        AVG(p.diff_rating) AS mean_difficulty,
        STDDEV(p.diff_rating) AS difficulty_stddev,
        COUNT(p.problem_id) AS num_problems,
        (SELECT COUNT(DISTINCT pt.tag_id) 
         FROM problems p2 
         JOIN problem_tags pt ON p2.problem_id = pt.problem_id 
         WHERE p2.contest_id = c.contest_id) AS tag_variety
    FROM contests c
    JOIN problems p ON c.contest_id = p.contest_id
    GROUP BY c.contest_id
    """
    
    execute_query(cursor, fetch_data_query)
    rows = cursor.fetchall()

    # Step 3: Label data based on the defined criteria
    update_query = """
    UPDATE contests
    SET is_balanced = %s
    WHERE contest_id = %s
    """
    
    values_to_update = []
    
    for row in rows:
        contest_id, mean_difficulty, difficulty_stddev, num_problems, tag_variety = row
        print(contest_id,difficulty_stddev)
        
        # Labeling logic (example)
        is_balanced = (
            difficulty_stddev < 500 and  # Standard deviation threshold
            tag_variety >= 3             # Minimum tag variety
        )
        
        values_to_update.append((is_balanced, contest_id))
    
    # Step 4: Update the database with the labels
    try:
        execute_query(cursor, update_query, values_to_update)
        db.commit()
        print(f"Updated {cursor.rowcount} contests with labels.")
    except mysql.connector.Error as err:
        print(f"Error updating labels: {err}")

    # Close the database connection
    close_db_connection(db, cursor)

# Main function to run the labeling
if __name__ == "__main__":
    label_data()