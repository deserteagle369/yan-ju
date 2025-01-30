const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前动态云环境
});

exports.main = async (event, context) => {
  const { openId, nickName, avatarUrl } = event;
  try {
    // 更新数据库中的用户信息
    await db.collection('users').doc(openId).update({
      data: {
        nickName,
        avatarUrl
      }
    });
    return { success: true };
  } catch (e) {
    console.error(e);
    throw new Error('信息填写失败');
  }
};