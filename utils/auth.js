// utils/auth.js
import { promisifyRequest } from '../utils/promisifyRequest'; // 假设有一个promisifyRequest函数用于将wx.request封装为Promise形式

export const login = async () => {
  try {
    const { code } = await promisifyRequest(wx.login);
    if (code) {
      return callCloudFunction(code);
    } else {
      throw new Error('获取用户登录凭证失败');
    }
  } catch (error) {
    console.error('调用wx.login失败', error);
    throw error;
  }
};

export const callCloudFunction = async (code) => {
  try {
    const result = await wx.cloud.callFunction({
      name: 'wxLogin', // 确保这里的云函数名与你的云函数名称一致
      data: { code }
    });
    
    if (result.result.success) {
      return {
        openid: result.result.openid,
        message: result.result.message
      };
    } else {
      throw new Error(result.result.message);
    }
  } catch (error) {
    console.error('调用云函数失败', error);
    throw error;
  }
};