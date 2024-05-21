DROP TABLE IF EXISTS College;
CREATE TABLE IF NOT EXISTS College (  -- 学院
    college_id   INTEGER PRIMARY KEY, -- 学院编号
    college_name TEXT,                -- 学院名称
    teacher_id      INTEGER,             -- 院长编号
    FOREIGN KEY (teacher_id) REFERENCES Teacher(teacher_id)
);
DROP INDEX IF EXISTS College_Index;
CREATE UNIQUE INDEX IF NOT EXISTS College_Index ON College(college_id);
insert into College
values (1,'计算机学部',1),
       (2,'外语学院',2),
       (3,'数学学院',3),
       (4,'物理学院',4),
       (5,'化学学院',5),
       (6,'生物学院',6),
       (7,'历史学院',7),
       (8,'地理学院',8),
       (9,'政治学院',9),
       (10,'经济学院',10),
       (11,'法学院',11),
       (12,'教育学院',12),
       (13,'文学学院',13),
       (14,'哲学学院',14),
       (15,'美术学院',15),
       (16,'音乐学院',16),
       (17,'体育学院',17),
       (18,'舞蹈学院',18),
       (19,'戏剧学院',19),
       (20,'影视学院',20);
insert into College
values (21,'软件学院',21);