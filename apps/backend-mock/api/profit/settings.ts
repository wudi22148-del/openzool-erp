import { getUserPreference, saveUserPreference } from '../db/user-preferences';

const SETTINGS_KEY = 'profit_settings';
const SYSTEM_USER_ID = 0;

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    try {
      const settings = await getUserPreference(SYSTEM_USER_ID, SETTINGS_KEY);
      return {
        code: 0,
        data: settings || { jpyExchangeRate: 0.043, shippingPresets: { 投函: 0, 普货: 0 } },
        message: 'success',
      };
    } catch (error: any) {
      return { code: -1, data: null, message: error.message };
    }
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event);
      await saveUserPreference(SYSTEM_USER_ID, SETTINGS_KEY, body);
      return { code: 0, data: null, message: '保存成功' };
    } catch (error: any) {
      return { code: -1, data: null, message: error.message };
    }
  }

  return { code: -1, data: null, message: '不支持的请求方法' };
});
