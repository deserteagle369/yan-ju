// 云函数 cloudGetDishesByCategory/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 自动选择环境
});

exports.main = async (event, context) => {
  const { category } = event;
  const db = cloud.database();

  try {
    const result = await db.collection('dishes')
      .where({
        dishCategory: category
      })
      .get();

    return {
      code: 0,
      data: result.data,
      message: '查询成功'
    };
  } catch (error) {
    return {
      code: -1,
      message: '查询失败',
      error: error
    };
  }
};
