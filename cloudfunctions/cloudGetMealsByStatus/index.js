// 云函数名称: cloudGetMealsByStatus  
const cloud = require('wx-server-sdk');  
  
cloud.init({  
  env: cloud.DYNAMIC_CURRENT_ENV  
});  
  
exports.main = async (event, context) => {  
  const db = cloud.database();  
  const { status, openid } = event;  
  
  try {  
    // 查询同时满足创建者或参与者条件的团餐
    const mealsRes = await db.collection('meals')
      .where({
        $or: [
          { _openid: openid, status: status }, // 用户创建的团餐
          { participants: openid, status: status } // 用户参与的团餐
        ]
      })
      .get();

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
        if (!openIds.has(order.openid)) {  
          openIds.add(order.openid);  
          participantCount++;  
        }  
        order.dishOrders.forEach(dishOrder => {  
          dishCount += dishOrder.quantity;  
        });  
      });  

      // 添加 isCreator 字段以标记是否为创建者
      const isCreator = meal._openid === openid;

      // 将整合后的信息添加到 mealsWithCounts 数组中  
      mealsWithCounts.push({  
        ...meal,  
        isCreator, // 标记是否为创建者
        participantCount, // 参与人数量  
        dishCount // 菜品数量总和  
      });  
    }  

    return {  
      success: true,
      data: {  
        meals: mealsWithCounts,  
        total: mealsWithCounts.length  
      }  
    };  
  } catch (e) {  
    console.error("查询出错:", e);  
    return {  
      success: false,
      error: `获取团餐列表失败: ${e.message}`  
    };  
  }  
};
