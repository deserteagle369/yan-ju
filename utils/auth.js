// utils/auth.js
import { promisifyRequest } from '../utils/promisifyRequest'; // 假设有一个promisifyRequest函数用于将wx.request封装为Promise形式

const APPID = 'wx82135acdebf65210';
const SECRET = 'bf035ecfb3375386f64eb6a30c0978dc';

export const login = async () => {
  try {
    const { code } = await promisifyRequest(wx.login);
    if (code) {
      return exchangeCodeForOpenidAndSessionKey(code);
    } else {
      throw new Error('获取用户登录凭证失败');
    }
  } catch (error) {
    console.error('调用wx.login失败', error);
    throw error;
  }
};

export const exchangeCodeForOpenidAndSessionKey = async (code) => {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;

  try {
    const response = await promisifyRequest(wx.request, {
      url,
      method: 'GET'
    });
    if (response.statusCode === 200 && response.data.errcode === 0) {
      return {
        openid: response.data.openid,
        session_key: response.data.session_key
      };
    } else {
      throw new Error(`交换登录凭证code失败: ${response.data.errmsg}`);
    }
  } catch (error) {
    console.error('请求jscode2session接口失败', error);
    throw error;
  }
};