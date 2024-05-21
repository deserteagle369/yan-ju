// 云函数：getUserProfile/index.js
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 导出的云函数入口
exports.main = async (event, context) => {
  // 解析传来的参数
  const { openid } = event;

  // 检查openid是否提供
  if (!openid) {
    return { success: false, message: '未提供用户openid' };
  }

  try {
    const db = cloud.database();
    // 在users集合中查询用户信息
    const userDoc = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userDoc.data.length === 0) {
      // 如果未找到用户，返回错误信息
      return { success: false, message: '用户信息未找到' };
    }

    // 返回查询到的用户信息
    return {
      success: true,
      data: userDoc.data[0].user
    };
  } catch (error) {
    console.error('云函数执行出错:', error);
    return {
      success: false,
      message: '获取用户信息失败',
      error: error.message
    };
  }
};