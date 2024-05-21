// 云函数名称: getMealsByStatus
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  console.log(`启动云函数 getMealsByStatus，参数为：${JSON.stringify(event)}`);

  const { status } = event;

  if (typeof status === 'undefined' || status === '') {
    return {
      error: '启动云函数 getMealsByStatus 失败: 缺少 status 参数'
    };
  }

  try {
    const db = cloud.database();
    const mealsRes = await db.collection('meals')
                          .where({ status })
                          .orderBy('createdAt', 'desc')
                          .get();

    const meals = mealsRes.data.map(meal => {
      const participantCount = meal.participantOrders.length;
      const dishIds = meal.participantOrders.reduce((acc, order) => acc.concat(order.dishIds), []);
      const dishCount = [...new Set(dishIds)].length;
      // 成功时返回的数据结构
      return {
        ...meal,
        participantCount,
        dishCount
      };
    });

    console.log(`返回结果为：${JSON.stringify(meals)}`);

    return { 
      data: {
        meals:meals || [],
        total: meals ? meals.length : 0
      }
    };
  } catch (e) {
    // 发生错误时返回的数据结构
    console.error("查询出错:", e); 
    return {
      error: `获取团餐列表失败: ${e.message}`
    };
  }
};