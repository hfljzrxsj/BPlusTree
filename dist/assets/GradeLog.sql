DROP TABLE IF EXISTS GradeLog;
CREATE TABLE IF NOT EXISTS GradeLog (
    student_id INT REFERENCES Students(student_id),
    course_id  INT REFERENCES Course(course_id),
    score_old  INT,
    score_new  INT,
    log_time   TIMESTAMP UNIQUE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);
DROP INDEX IF EXISTS GradeLog_Index;
CREATE UNIQUE INDEX IF NOT EXISTS GradeLog_Index ON GradeLog(student_id,course_id);
DROP TRIGGER IF EXISTS GradeLogTrigger;