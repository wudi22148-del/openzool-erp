-- ============================================
-- 用户管理模块数据库表
-- ============================================

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'operator',
  manager_name VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_role CHECK (role IN ('admin', 'supervisor', 'operator')),
  CONSTRAINT chk_status CHECK (status IN ('active', 'inactive'))
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_manager_name ON users(manager_name);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 3. 添加表注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.username IS '用户名（登录账号）';
COMMENT ON COLUMN users.password IS '密码（加密存储）';
COMMENT ON COLUMN users.real_name IS '真实姓名';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.phone IS '手机号';
COMMENT ON COLUMN users.role IS '角色：admin=管理员, supervisor=主管, operator=运营';
COMMENT ON COLUMN users.manager_name IS '管理人名称（运营角色对应的管理人）';
COMMENT ON COLUMN users.status IS '状态：active=启用, inactive=禁用';

-- 4. 插入默认管理员账号
INSERT INTO users (username, password, real_name, role, status)
VALUES ('admin', '123456', '系统管理员', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- 5. 显示成功消息
DO $$
BEGIN
    RAISE NOTICE '✓ 用户表创建完成';
    RAISE NOTICE '✓ 默认管理员账号: admin / 123456';
END $$;
