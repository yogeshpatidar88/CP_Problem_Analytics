USE cpdbs;

DROP TABLE IF EXISTS problem_tags;
DROP TABLE IF EXISTS user_contests;
DROP TABLE IF EXISTS contest_authors;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tags;

CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100),
    rating SMALLINT DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    university VARCHAR(100) DEFAULT NULL,
    problem_count SMALLINT DEFAULT 0,
    max_rating SMALLINT DEFAULT NULL,
    rating_title VARCHAR(30),
    last_updated DATETIME NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE contests (
    contest_id INT PRIMARY KEY,
    contest_name VARCHAR(1000),
    start_time DATETIME,
    end_time DATETIME,
    duration VARCHAR(20),
    contest_type VARCHAR(20),
    is_balanced BOOL DEFAULT TRUE
);

CREATE TABLE problems (
    problem_id VARCHAR(10) PRIMARY KEY,
    title VARCHAR(100),
    contest_id INT,
    diff_rating SMALLINT DEFAULT 800,
    memory_limit VARCHAR(20) DEFAULT '256 megabyte',
    time_limit VARCHAR(20) DEFAULT '1 second',
    FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);

CREATE TABLE submissions(
    submission_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    problem_id VARCHAR(10),
    username VARCHAR(50),
    verdict VARCHAR(30),
    submission_time DATETIME,
    execution_time SMALLINT,
    memory_used VARCHAR(20),
    language_used VARCHAR(50),
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id),
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE tags(
    tag_id INT PRIMARY KEY AUTO_INCREMENT,
    tag_name VARCHAR(50)
);

CREATE TABLE problem_tags(
    problem_id VARCHAR(10),
    tag_id INT,
    FOREIGN KEY (problem_id) REFERENCES problems(problem_id),
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

CREATE TABLE user_contests(
    username VARCHAR(50),
    contest_id INT,
    contest_rank INT,
    rating_change SMALLINT,
    final_rating SMALLINT,
    penalty SMALLINT,
    FOREIGN KEY (username) REFERENCES users(username),
    FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);

CREATE TABLE contest_authors(
    username VARCHAR(50),
    contest_id INT,
    FOREIGN KEY (username) REFERENCES users(username),
    FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);

INSERT INTO tags (tag_name) VALUES 
('implementation'), 
('dp'), 
('math'), 
('greedy'), 
('data structures'), 
('brute force'), 
('sortings'), 
('binary search'), 
('dfs and similar'), 
('graphs'), 
('trees'), 
('strings'), 
('number theory'), 
('geometry'), 
('bitmasks'), 
('combinatorics'), 
('two pointers'), 
('probabilities'), 
('shortest paths'), 
('hashing'), 
('divide and conquer'), 
('games'), 
('constructive algorithms'), 
('dsu'), 
('flows'), 
('interactive'), 
('fft'), 
('graph matchings'), 
('matrices'), 
('meet-in-the-middle'), 
('ternary search'), 
('expression parsing');
