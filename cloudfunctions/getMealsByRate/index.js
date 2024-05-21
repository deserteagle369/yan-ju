// 云函数名称: getMealsByRate
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  console.log(`启动云函数 getMealsByRate，参数为：${JSON.stringify(event)}`);

  const { sortBy = 'mealRate', sortOrder = 'desc' } = event;

  if (typeof sortBy === 'undefined' || typeof sortOrder === 'undefined') {
    return {
      error: '启动云函数 getMealsByRate 失败: 缺少 sortBy 或 sortOrder 参数'
    };
  }

  try {
    const db = cloud.database();
    const topRatedMeals = await db.collection('meals')
      .orderBy(sortBy, sortOrder) // 使用传入的排序参数
      .limit(3) // 获取评分最高的前3个团餐
      .get();

    const mealsWithDetails = topRatedMeals.data.map(meal => {
      // 计算参与者数量
      const participantCount = meal.participantOrders.length;
      // 计算不重复的菜品数量
      const dishIds = meal.participantOrders.reduce((acc, order) => acc.concat(order.dishIds), []);
      const dishCount = [...new Set(dishIds)].length;

      return {
        ...meal,
        participantCount,
        dishCount
      };
    });

    console.log(`返回结果为：${JSON.stringify(mealsWithDetails)}`);

    return { 
      data: {
        meals: mealsWithDetails || [],
        total: mealsWithDetails.length
      }
    };
  } catch (e) {
    console.error("查询出错:", e);
    return {
      error: `获取评分最高的团餐失败: ${e.message}`
    };
  }
};