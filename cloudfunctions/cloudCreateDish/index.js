//cloudCreateDish
// 引入云开发能力
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});

// 获取数据库引用
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('event:', event);
  try {
    // event 应包含菜品信息，如 dishName, ingredients, time, spicyLevel, dishImageUrl
    const { dishName, dishCategory, selectedIngredients, time, selectedSpicyLevel, dishImageUrl, openid} = event;

    // 向数据库的某个集合添加记录
    const result = await db.collection('dishes').add({
      data: {
        dishName,
        dishCategory,
        selectedIngredients,
        selectedSpicyLevel,
        time,
        dishImageUrl,
        createdAt: db.serverDate(), // 记录创建时间
        openid,
      }
    });

    // 返回添加结果
    return {
      success: true,
      data: result
    };
  } catch (err) {
    // 捕获并返回错误信息
    return {
      success: false,
      errorMessage: err.message
    };
  }
};
