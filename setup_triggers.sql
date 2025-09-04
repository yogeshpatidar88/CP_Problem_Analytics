USE cpdbs;

DELIMITER $$

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
END$$

CREATE TRIGGER increment_problem_count
AFTER INSERT ON submissions
FOR EACH ROW
BEGIN
    IF NEW.verdict = 'Accepted' THEN
        UPDATE users
        SET problem_count = problem_count + 1
        WHERE username = NEW.username;
    END IF;
END$$

CREATE TRIGGER update_max_rating
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.rating > OLD.max_rating THEN
        SET NEW.max_rating = NEW.rating;
    END IF;
END$$

CREATE TRIGGER record_last_login
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.last_updated < NEW.last_updated THEN
        SET NEW.last_updated = NOW();
    END IF;
END$$

DELIMITER ;
