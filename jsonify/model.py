import mysql.connector
import pandas as pd
from db import get_db_connection, close_db_connection, execute_query
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

def fetch_labeled_data():
    # Connect to the database
    db, cursor = get_db_connection()
    
    # Query to fetch the features and labels
    query = """
    SELECT 
        AVG(p.diff_rating) AS mean_difficulty,
        STDDEV(p.diff_rating) AS difficulty_stddev,
        COUNT(p.problem_id) AS num_problems,
        (SELECT COUNT(DISTINCT pt.tag_id) 
         FROM problems p2 
         JOIN problem_tags pt ON p2.problem_id = pt.problem_id 
         WHERE p2.contest_id = c.contest_id) AS tag_variety,
        c.is_balanced
    FROM contests c
    JOIN problems p ON c.contest_id = p.contest_id
    GROUP BY c.contest_id
    """
    
    execute_query(cursor, query)
    rows = cursor.fetchall()

    # Convert the data into a DataFrame
    columns = ['mean_difficulty', 'difficulty_stddev', 'num_problems', 'tag_variety', 'is_balanced']
    data = pd.DataFrame(rows, columns=columns)

    # Close the database connection
    close_db_connection(db, cursor)

    return data

def preprocess_data(data):
    # Handle missing values (if any)
    data = data.dropna()
    
    # Split features and labels
    X = data[['mean_difficulty', 'difficulty_stddev', 'num_problems', 'tag_variety']]
    y = data['is_balanced'].astype(int)  # Convert labels to integer

    # Check the distribution of the labels
    print("Label distribution:")
    print(y.value_counts())

    return X, y

def train_logistic_regression(X, y):
    # Check if we have more than one class in the labels
    if len(y.unique()) < 2:
        raise ValueError("The dataset must contain at least two classes for logistic regression.")

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=69)

    # Initialize the Logistic Regression model with class weighting
    model = LogisticRegression(class_weight='balanced')  # Adjusting for class imbalance
    model.fit(X_train, y_train)

    # Evaluate the model on the training set
    y_train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    print(f"Training Accuracy: {train_accuracy}")
    print("Training Classification Report:")
    print(classification_report(y_train, y_train_pred))

    # Make predictions on the test set
    y_test_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    print(f"Test Accuracy: {test_accuracy}")
    print("Test Classification Report:")
    print(classification_report(y_test, y_test_pred))

    return model

# Main function to run the process
if __name__ == "__main__":
    # Step 1: Fetch and preprocess the data
    data = fetch_labeled_data()
    X, y = preprocess_data(data)

    # Step 2: Train the logistic regression model and evaluate it
    model = train_logistic_regression(X, y)
    
    