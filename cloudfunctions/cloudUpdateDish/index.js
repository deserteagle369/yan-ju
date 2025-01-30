  // 云函数名称: cloudUpdateDish  
  // 参数说明:  
  //  - dishId: 要更新的菜品的 id
  //  - updates: 要更新的菜品属性，是一个包含属性名和属性值的对象
  // 返回值: 一个包含 updated 属性的对象，表示更新成功的菜品数量
// cloudUpdateDish
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { dishId, dishName, dishCategory, selectedIngredients, time, selectedSpicyLevel, dishImageUrl, openid } = event;

  try {
    const result = await db.collection('dishes').doc(dishId).update({
      data: {
        dishName: dishName,
        dishCategory: dishCategory,
        selectedIngredients: selectedIngredients,
        time: time,
        selectedSpicyLevel: selectedSpicyLevel,
        dishImageUrl: dishImageUrl,
        lastUpdatedAt: db.serverDate(), // 更新最后修改时间
        openid: openid
      }
    });

    return {
      success: true,
      data: result
    };
  } catch (err) {
    return {
      success: false,
      errorMessage: err.message
    };
  }
};
