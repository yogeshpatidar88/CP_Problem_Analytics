import mysql.connector

# Connect to the database
db = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="279936",
    database="cpdbs"
)
cursor = db.cursor()

# SQL command to insert tags
insert_tags_query = """
INSERT INTO tags (tag_name) VALUES
('2-sat'),
('binary search'),
('bitmasks'),
('brute force'),
('chinese remainder theorem'),
('combinatorics'),
('constructive algorithms'),
('data structures'),
('dfs and similar'),
('divide and conquer'),
('dp'),
('dsu'),
('expression parsing'),
('fft'),
('flows'),
('games'),
('geometry'),
('graph matchings'),
('graphs'),
('greedy'),
('hashing'),
('implementation'),
('interactive'),
('math'),
('matrices'),
('meet-in-the-middle'),
('number theory'),
('probabilities'),
('schedules'),
('shortest paths'),
('sortings'),
('string suffix structures'),
('strings'),
('ternary search'),
('trees'),
('two pointers');
"""

try:
    cursor.execute(insert_tags_query)
    db.commit()
    print("Tags added successfully.")
except mysql.connector.Error as err:
    print(f"Error: {err}")

# Close the cursor and connection
cursor.close()
db.close()
