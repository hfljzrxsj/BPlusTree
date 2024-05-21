DROP TABLE IF EXISTS Teacher;
CREATE TABLE IF NOT EXISTS Teacher (
    teacher_id   INTEGER PRIMARY KEY,                                                         -- 教师编号
    teacher_name TEXT,                                                                        -- 教师姓名
    sex          Integer check (sex=1 or sex=0)        DEFAULT Null,                          -- 性别，1是男，0是女
    hire_date    DATE NOT NULL                         DEFAULT (datetime('now','localtime')), -- 入职日期
    age          INTEGER check (age between 0 and 100) DEFAULT NULL                           -- 年龄
);
DROP INDEX IF EXISTS Teacher_Index;
CREATE UNIQUE INDEX IF NOT EXISTS Teacher_Index ON Teacher(teacher_id);
insert into Teacher(teacher_id,teacher_name)
values (1,'王一'),
       (2,'李二'),
       (3,'张三'),
       (4,'李四'),
       (5,'王五'),
       (6,'赵六'),
       (7,'孙七'),
       (8,'周八'),
       (9,'吴九'),
       (10,'郑十'),
       (11,'王十一'),
       (12,'李十二'),
       (13,'张十三'),
       (14,'李十四'),
       (15,'王十五'),
       (16,'赵十六'),
       (17,'孙十七'),
       (18,'周十八'),
       (19,'吴十九'),
       (20,'郑二十');
insert into Teacher(teacher_id,teacher_name)
values (21,'云天明'),
       (22,'云天雄'),
       (23,'云天翔'),
       (24,'云天翼'),
       (25,'云天行'),
       (26,'云天涯'),
       (27,'云天宇'),
       (28,'云天空'),
       (29,'云天风'),
       (30,'云天地'),
       (31,'云天海'),
       (32,'云天山'),
       (33,'云天湖'),
       (34,'云天河'),
       (35,'云天星'),
       (36,'云天月'),
       (37,'云天日'),
       (38,'云天云'),
       (39,'云天飞'),
       (40,'云天龙');
insert into Teacher(teacher_id,teacher_name)
values (41,'宋江'),
       (42,'卢俊义'),
       (43,'吴用'),
       (44,'公孙胜'),
       (45,'关胜'),
       (46,'林冲'),
       (47,'秦明'),
       (48,'呼延灼'),
       (49,'花荣'),
       (50,'柴进'),
       (51,'李应'),
       (52,'朱仝'),
       (53,'鲁智深'),
       (54,'武松'),
       (55,'董平'),
       (56,'张清'),
       (57,'杨志'),
       (58,'徐宁'),
       (59,'索超'),
       (60,'戴宗');