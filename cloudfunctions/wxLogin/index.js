// 云函数：wxLogin.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { code } = event;
  const { OPENID, APPID, SECRET } = process.env; // 从环境变量获取必要的信息

  if (!code) {
    return {
      success: false,
      message: 'Missing code',
      data: null
    };
  }

  try {
    // 调用微信的 wxaCode2Session 接口换取 openid 和 session_key
    const wxaCode2SessionRes = await cloud.httpclient.request({
      url: `https://api.weixin.qq.com/sns/jscode2session`,
      method: 'GET',
      data: {
        appid: APPID,
        secret: SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, errcode } = wxaCode2SessionRes.data;

    if (errcode === 0) {
      // 微信接口调用成功，openid获取成功
      // 这里可以进行后续的用户信息保存等操作
      // 例如，保存用户的openid到云数据库
      const newNickname = `用户${user.openid.slice(-3)}`;
      const saveResult = await db.collection('users').doc(openid).set({
        data: {
          // 这里可以添加其他需要保存的用户信息
          openid,
          nickname:newNickname
        }
      });

      return {
        success: true,
        message: '登录成功',
        openid: openid
      };
    } else {
      // 微信接口调用失败
      return {
        success: false,
        message: `登录失败，错误码：${errcode}`,
        data: null
      };
    }
  } catch (error) {
    console.error('登录云函数调用失败:', error);
    return {
      success: false,
      message: '登录云函数调用失败',
      data: null
    };
  }
};