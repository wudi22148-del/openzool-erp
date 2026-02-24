import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import { MOCK_USERS } from '~/utils/mock-data';
import {
  forbiddenResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';
import { getUserByUsername } from '../db/users';

export default defineEventHandler(async (event) => {
  const { password, username } = await readBody(event);
  if (!password || !username) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Username and password are required',
    );
  }

  // 先尝试从数据库查找用户
  let findUser = null;
  try {
    const dbUser = await getUserByUsername(username);
    if (dbUser && dbUser.password === password) {
      // 检查用户状态
      if (dbUser.status === 'inactive') {
        clearRefreshTokenCookie(event);
        return forbiddenResponse(event, '账号已被禁用');
      }

      // 转换为系统需要的格式
      findUser = {
        id: dbUser.id,
        username: dbUser.username,
        realName: dbUser.realName,
        roles: [dbUser.role], // 将role转换为roles数组
        managerName: dbUser.managerName,
      };
    }
  } catch (error) {
    console.error('数据库查询用户失败:', error);
  }

  // 如果数据库中没找到，尝试从MOCK_USERS查找（兼容旧系统）
  if (!findUser) {
    const mockUser = MOCK_USERS.find(
      (item) => item.username === username && item.password === password,
    );
    if (mockUser) {
      findUser = mockUser;
    }
  }

  if (!findUser) {
    clearRefreshTokenCookie(event);
    return forbiddenResponse(event, 'Username or password is incorrect.');
  }

  const accessToken = generateAccessToken(findUser);
  const refreshToken = generateRefreshToken(findUser);

  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    ...findUser,
    accessToken,
  });
});
