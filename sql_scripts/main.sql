drop database if exists cpdbs;
create database cpdbs;
use cpdbs; 
drop table if exists problems;
drop table if exists contests;
drop table if exists users;
drop table if exists submissions;
drop table if exists tags;
drop table if exists problem_tags;
drop table if exists user_contests;
drop table if exists contest_authors;

create table users (
    username varchar(50) primary key,
    email varchar(100),
    rating smallint default null,
    country varchar(100) default null,
    university varchar(100) default null,
    problem_count smallint default 0,
    max_rating smallint default null,
    rating_title varchar(30),
    last_updated DATETIME NULL,
    password varchar(255) NOT NULL
);


create table contests (
    contest_id int primary key,
    contest_name varchar(1000),
    start_time datetime,
    end_time datetime,
    duration varchar(20),
    contest_type varchar(20),
    is_balanced bool DEFAULT True
);

create table problems (
    problem_id varchar(10) primary key default '800',
    title varchar(100),
    contest_id int,
    diff_rating smallint default 800,
    memory_limit varchar(20) default '256 megabyte',
    time_limit varchar(20) default '1 second',
    foreign key (contest_id) references contests(contest_id)
);

create table submissions(
    submission_id bigint primary key auto_increment,
    problem_id varchar(10),
    username varchar(50),
    verdict varchar(30),
    submission_time datetime,
    execution_time smallint,
    memory_used varchar(20),
    language_used varchar(50),
    foreign key (problem_id) references problems(problem_id),
    foreign key (username) references users(username)
);


create table tags(
    tag_id int primary key auto_increment,
    tag_name varchar(50)
);

create table problem_tags(
    problem_id varchar(10),
    tag_id int,
    foreign key (problem_id) references problems(problem_id),
    foreign key (tag_id) references tags(tag_id)
);

create table user_contests(
    username varchar(50),
    contest_id int,
    contest_rank int,
    rating_change smallint,
    final_rating smallint,
    penalty smallint,
    foreign key (username) references users(username),
    foreign key (contest_id) references contests(contest_id)
);

create table contest_authors(
    username varchar(50),
    contest_id int,
    foreign key (username) references users(username),
    foreign key (contest_id) references contests(contest_id)
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

drop trigger if exists update_rating_title;

CREATE TRIGGER update_rating_title
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    DECLARE new_title VARCHAR(30);

    IF NEW.rating < 1200 THEN
        SET new_title = 'Newbie';
    ELSEIF NEW.rating < 1400 THEN
        SET new_title = 'Pupil';
    ELSEIF NEW.rating < 1600 THEN
        SET new_title = 'Specialist';
    ELSEIF NEW.rating < 1900 THEN
        SET new_title = 'Expert';
    ELSEIF NEW.rating < 2100 THEN
        SET new_title = 'Candidate Master';
    ELSEIF NEW.rating < 2300 THEN
        SET new_title = 'Master';
    ELSEIF NEW.rating < 2400 THEN
        SET new_title = 'International Master';
    ELSEIF NEW.rating < 2600 THEN
        SET new_title = 'Grandmaster';
    ELSEIF NEW.rating < 3000 THEN
        SET new_title = 'International Grandmaster';
    ELSEIF NEW.rating < 4000 THEN
        SET new_title = 'Legendary Grandmaster';
    ELSE
        SET new_title = 'Tourist';
    END IF;

    SET NEW.rating_title = new_title;
END;

CREATE TRIGGER increment_problem_count
AFTER INSERT ON submissions
FOR EACH ROW
BEGIN
    IF NEW.verdict = 'Accepted' THEN
        UPDATE users
        SET problem_count = problem_count + 1
        WHERE username = NEW.username;
    END IF;
END;

CREATE TRIGGER update_max_rating
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.rating > OLD.max_rating THEN
        SET NEW.max_rating = NEW.rating;
    END IF;
END;

CREATE TRIGGER record_last_login
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.last_updated < NEW.last_updated THEN
        SET NEW.last_updated = NOW();
    END IF;
END;























SELECT t.tag_name, COUNT(DISTINCT s.problem_id) AS problem_count
        FROM submissions s
        JOIN problems p ON s.problem_id = p.problem_id
        JOIN problem_tags pt ON p.problem_id = pt.problem_id
        JOIN tags t ON pt.tag_id = t.tag_id
        WHERE s.username = 'pjn69' AND s.verdict = 'Accepted'
        GROUP BY t.tag_name
        ORDER BY problem_count DESC


select * from users;

select * from contests;
select * from user_contests;

select * from submissions;

select * from problems;

SELECT 
    MIN(contest_rank) AS best_rank
FROM 
    user_contests
WHERE 
    username = 'pjn69';


SELECT p.problem_id, p.diff_rating, pt.tag_id
FROM problems p
JOIN problem_tags pt ON p.problem_id = pt.problem_id
WHERE p.problem_id IN (
    SELECT problem_id
    FROM submissions
    WHERE username = 'pjn69' AND verdict = 'Accepted'
)
ORDER BY (
    SELECT submission_time 
    FROM submissions 
    WHERE username = 'pjn69' AND problem_id = p.problem_id 
    LIMIT 1
) DESC
LIMIT 10;

select * from tags;

select * from problem_tags;

SELECT 
    username, 
    email, 
    rating, 
    country, 
    university, 
    problem_count, 
    max_rating 
FROM users 
WHERE username = 'pjn69';


SELECT s.submission_id, s.problem_id, s.username, s.verdict, s.execution_time, 
           s.memory_used, s.language_used
    FROM submissions s
    WHERE s.username = 'pjn69'
    ORDER BY s.submission_time DESC
    LIMIT 10;