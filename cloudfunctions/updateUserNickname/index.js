// 云函数：updateUserNickname.js
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, nickname } = event; // 从事件对象中获取用户的openid和新昵称

  if (!openid || !nickname) {
    return {
      success: false,
      message: '缺少必要的参数',
      data: null
    };
  }

  try {
    // 在云数据库中更新用户昵称
    const updateResult = await db.collection('users').doc(openid).update({
      data: {
        nickName: nickname // 更新用户的昵称
      }
    });

    if (updateResult.stats.updated) {
      // 更新成功
      return {
        success: true,
        message: '昵称更新成功',
        data: { nickName: nickname } // 返回更新后的昵称
      };
    } else {
      // 未找到用户或用户信息未变化
      return {
        success: false,
        message: '用户信息未更新或未找到匹配的用户',
        data: null
      };
    }
  } catch (error) {
    console.error('更新昵称失败:', error);
    return {
      success: false,
      message: '更新昵称失败',
      data: null
    };
  }
};