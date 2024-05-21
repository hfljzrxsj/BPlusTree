DROP TABLE IF EXISTS Course;
CREATE TABLE IF NOT EXISTS Course (
    course_id    INTEGER PRIMARY KEY,                                              -- 课程编号
    course_name  TEXT,                                                             -- 课程名称
    college_id   INTEGER,                                                          -- 学院编号
    credit_hours REAL NOT NULL DEFAULT 1.0 CHECK (credit_hours between 0.5 and 5), -- 学分
    log_time TIMESTAMP NOT NULL DEFAULT (datetime('now','localtime')),            -- 录入时间
    FOREIGN KEY (college_id) REFERENCES College(college_id)
);
DROP INDEX IF EXISTS Course_Index;
CREATE UNIQUE INDEX IF NOT EXISTS Course_Index ON Course(course_id);
insert into Course(course_id,course_name,college_id)
VALUES (1,'高等数学',1),
       (2,'线性代数',1),
       (3,'概率论与数理统计',1),
       (4,'离散数学',1),
       (5,'计算机组成原理',1),
       (6,'数据结构',1),
       (7,'操作系统',1),
       (8,'计算机网络',1),
       (9,'数据库原理',1),
       (10,'软件工程',1),
       (11,'编译原理',1),
       (12,'计算机图形学',1),
       (13,'计算机视觉',1),
       (14,'机器学习',1),
       (15,'深度学习',1),
       (16,'自然语言处理',1),
       (17,'计算机网络安全',1),
       (18,'信息安全',1),
       (19,'密码学',1),
       (20,'网络安全',1),
       (21,'软件工程',2),
       (22,'软件测试',2),
       (23,'软件质量保证',2),
       (24,'软件项目管理',2),
       (25,'软件需求工程',2),
       (26,'软件体系结构',2),
       (27,'软件设计模式',2),
       (28,'软件开发方法',2),
       (29,'软件工程经济学',2),
       (30,'软件工程管理',2);