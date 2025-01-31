const cloud = require('wx-server-sdk');

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  try {
    const res = await db.collection('ingredients')
      .where({
        subcategory: event.subcategory
      })
      .get();
    return {
      success: true,
      data: res.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
