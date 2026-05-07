import { getUserPreference, saveUserPreference } from '../db/user-preferences';

const CHANNELS_KEY = 'freight_channels';
const SYSTEM_USER_ID = 0;

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    try {
      const channels = await getUserPreference(SYSTEM_USER_ID, CHANNELS_KEY);
      return {
        code: 0,
        data: channels || [],
        message: 'success',
      };
    } catch (error: any) {
      return { code: -1, data: [], message: error.message };
    }
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event);
      await saveUserPreference(SYSTEM_USER_ID, CHANNELS_KEY, body);
      return { code: 0, data: null, message: '保存成功' };
    } catch (error: any) {
      return { code: -1, data: null, message: error.message };
    }
  }

  return { code: -1, data: null, message: '不支持的请求方法' };
});
