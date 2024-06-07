// 云函数名称: cloudGetMealsByStatus  
const cloud = require('wx-server-sdk');  
  
cloud.init({  
  env: cloud.DYNAMIC_CURRENT_ENV  
});  
  
exports.main = async (event, context) => {  
  const { status } = event;  
  
  if (typeof status === 'undefined' || status === '') {  
    return {  
      error: '缺少 status 参数'  
    };  
  }  
  
  try {  
    const db = cloud.database();  
    // 查询 meals 集合以获取符合状态的团餐  
    const mealsRes = await db.collection('meals')  
      .where({ status })  
      .orderBy('createdAt', 'desc')  
      .get();  
    console.log("云函数cloudGetMealsByStatus查询当前状态下的团餐信息mealsRes:", mealsRes.data);    
    const mealsWithCounts = [];  
  
    // 遍历 meals 集合的查询结果  
    for (const meal of mealsRes.data) {  
      let participantCount = 0;  
      let dishCount = 0;  
      const openIds = new Set(); // 用于记录不同的参与者openId  
  
      // 查询UserMealOrders集合，根据mealId获取相关的订单  
      const userMealOrdersRes = await db.collection('UserMealOrders')  
        .where({  
          mealId: meal._id // 使用meal的_id来查询  
        })  
        .get();  
      // 遍历查询结果，计算参与人数量和菜品数量  
      userMealOrdersRes.data.forEach(order => {  
        // 累加不同的参与者  
        if (!openIds.has(order.openid)) {  
          openIds.add(order.openid);  
          participantCount++;  
        }  
          
        // 累加菜品数量  
        order.dishOrders.forEach(dishOrder => {  
          dishCount += dishOrder.quantity;  
        });  
      });  
  
      // 将整合后的信息添加到 mealsWithCounts 数组中  
      mealsWithCounts.push({  
        ...meal,  
        participantCount, // 参与人数量  
        dishCount // 菜品数量总和  
      });  
    }  
  
    return {  
      data: {  
        meals: mealsWithCounts,  
        total: mealsWithCounts.length  
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