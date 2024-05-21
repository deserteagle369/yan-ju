// cloudfunctions/login/index.js

// 引入云开发能力
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});

exports.getUserOpenId = async (event, context) => {
  try {
    const { code } = event;

    if (!code) {
      return {
        success: false,
        message: '缺少登录授权code',
      };
    }

    // 使用微信SDK换取access_token和openid
    const result = await cloud.openapi.weixin.login({
      code,
    });

    if (result.errCode === 0) {
      const openid = result.openid;
      return {
        success: true,
        openid,
      };
    } else {
      console.error(`获取openid失败：${result.errMsg}`);
      return {
        success: false,
        message: result.errMsg,
      };
    }
  } catch (error) {
    console.error('获取openid时出错：', error);
    return {
      success: false,
      message: '获取openid过程中发生错误',
    };
  }
};