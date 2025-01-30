// 云函数：getUserInfo.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid } = event; // 从事件对象中获取用户的openid

  if (!openid) {
    return {
      success: false,
      message: '缺少必要的openid参数',
      data: null
    };
  }

  try {
    // 在云数据库中查询用户信息
    const userRes = await db.collection('users').where({
      _id: openid // 使用_openid作为字段来查询用户
    }).get();

    if (userRes.data.length > 0) {
      // 如果找到用户，返回用户信息
      const userInfo = userRes.data[0];
      return {
        success: true,
        message: '获取用户信息成功',
        data: userInfo
      };
    } else {
      // 如果未找到用户，返回错误信息
      return {
        success: false,
        message: '未找到该用户的信息',
        data: null
      };
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      message: '获取用户信息失败',
      data: null
    };
  }
};