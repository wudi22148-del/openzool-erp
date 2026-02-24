-- 连接到数据库后运行这些命令查看

-- 1. 查看所有数据库
SELECT datname FROM pg_database WHERE datistemplate = false;

-- 2. 连接到 readme_to_recover 数据库后，查看表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 3. 读取 readme 表内容
SELECT * FROM readme;
