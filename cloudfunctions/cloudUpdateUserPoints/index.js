// 云函数 cloudUpdateUserPoints
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { openid, increment } = event;

  try {
    const db = cloud.database();
    const result = await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        points: db.command.inc(increment)  // 增加积分
      }
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
