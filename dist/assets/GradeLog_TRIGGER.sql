CREATE TRIGGER IF NOT EXISTS GradeLogTrigger AFTER UPDATE OF score ON Grade FOR EACH ROW 
BEGIN
    INSERT INTO GradeLog VALUES (NEW.student_id,NEW.course_id,OLD.score,NEW.score,datetime('now'));
END;