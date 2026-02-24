import pool from './config';

export interface User {
  id?: number;
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'supervisor' | 'operator';
  managerName?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// 获取用户列表（带分页和筛选）
export async function getUsers(
  page: number,
  pageSize: number,
  keyword?: string,
  role?: string,
  status?: string
): Promise<{ items: User[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (keyword) {
    conditions.push(`(username ILIKE $${paramIndex} OR real_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${keyword}%`);
    paramIndex++;
  }

  if (role) {
    conditions.push(`role = $${paramIndex}`);
    params.push(role);
    paramIndex++;
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 获取总数
  const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // 获取分页数据
  const offset = (page - 1) * pageSize;
  const dataQuery = `
    SELECT id, username, real_name, email, phone, role, manager_name, status, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataParams = [...params, pageSize, offset];
  const dataResult = await pool.query(dataQuery, dataParams);

  const items = dataResult.rows.map(row => ({
    id: row.id,
    username: row.username,
    password: '', // 不返回密码
    realName: row.real_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    managerName: row.manager_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { items, total };
}

// 根据ID获取用户
export async function getUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, username, real_name, email, phone, role, manager_name, status, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    password: '',
    realName: row.real_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    managerName: row.manager_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 根据用户名获取用户（用于登录）
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, username, password, real_name, email, phone, role, manager_name, status FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    realName: row.real_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    managerName: row.manager_name,
    status: row.status,
  };
}

// 创建用户
export async function createUser(user: User): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (username, password, real_name, email, phone, role, manager_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, username, real_name, email, phone, role, manager_name, status, created_at, updated_at`,
    [user.username, user.password, user.realName, user.email, user.phone, user.role, user.managerName, user.status]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    password: '',
    realName: row.real_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    managerName: row.manager_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 更新用户
export async function updateUser(id: number, userData: Partial<User>): Promise<User | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (userData.realName !== undefined) {
    fields.push(`real_name = $${paramIndex}`);
    params.push(userData.realName);
    paramIndex++;
  }

  if (userData.email !== undefined) {
    fields.push(`email = $${paramIndex}`);
    params.push(userData.email);
    paramIndex++;
  }

  if (userData.phone !== undefined) {
    fields.push(`phone = $${paramIndex}`);
    params.push(userData.phone);
    paramIndex++;
  }

  if (userData.role !== undefined) {
    fields.push(`role = $${paramIndex}`);
    params.push(userData.role);
    paramIndex++;
  }

  if (userData.managerName !== undefined) {
    fields.push(`manager_name = $${paramIndex}`);
    params.push(userData.managerName);
    paramIndex++;
  }

  if (userData.status !== undefined) {
    fields.push(`status = $${paramIndex}`);
    params.push(userData.status);
    paramIndex++;
  }

  if (userData.password !== undefined) {
    fields.push(`password = $${paramIndex}`);
    params.push(userData.password);
    paramIndex++;
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, username, real_name, email, phone, role, manager_name, status, created_at, updated_at`,
    params
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    password: '',
    realName: row.real_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    managerName: row.manager_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 删除用户
export async function deleteUser(id: number): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// 检查用户名是否存在
export async function usernameExists(username: string, excludeId?: number): Promise<boolean> {
  let query = 'SELECT 1 FROM users WHERE username = $1';
  const params: any[] = [username];

  if (excludeId !== undefined) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
}
