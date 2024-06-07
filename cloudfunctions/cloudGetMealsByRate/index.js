// 云函数名称: getMealsByRate  
const cloud = require('wx-server-sdk');  
  
cloud.init({  
  env: cloud.DYNAMIC_CURRENT_ENV  
});  
  
exports.main = async (event, context) => {  
  console.log(`启动云函数 getMealsByRate，参数为：${JSON.stringify(event)}`);  
  
  const { sortBy = 'mealRate', sortOrder = 'desc' } = event;  
  
  if (!['mealRate'].includes(sortBy) || !['asc', 'desc'].includes(sortOrder)) {  
    return {  
      error: '启动云函数 getMealsByRate 失败: sortBy 或 sortOrder 参数无效'  
    };  
  }  
  
  try {  
    const db = cloud.database();  
    const mealsCollection = db.collection('meals');  
    const userMealOrdersCollection = db.collection('UserMealOrders');  
  
    // 第一步：获取评分最高的前3个团餐的mealId  
    const topRatedMealIds = await mealsCollection  
      .orderBy(sortBy, sortOrder)  
      .limit(3)  
      .get();  
  
    // 提取mealId数组  
    const mealIds = topRatedMealIds.data.map(meal => meal._id.toString());  
  
    // 第二步：获取meal的详情和计算参与者数量及菜品数量  
    const mealsWithDetails = await Promise.all(mealIds.map(async (mealId) => {  
      // 获取meal详情  
      const mealDetail = await mealsCollection.doc(mealId).get();  
      const meal = mealDetail.data;  
  
      // 获取UserMealOrders中与当前mealId相关的所有订单  
      const userMealOrdersRes = await userMealOrdersCollection  
        .where({  
          mealId  
        })  
        .get();  
  
      // 计算参与者数量（基于不同的openId）  
      const participantCount = new Set(userMealOrdersRes.data.map(order => order.openId)).size;  
  
      // 计算菜品数量（基于dishOrders中的quantity字段）  
      let dishCount = 0;  
      for (const order of userMealOrdersRes.data) {  
        for (const dishOrder of order.dishOrders) {  
          dishCount += dishOrder.quantity;  
        }  
      }  
  
      // 返回meal详情、参与者数量和菜品数量  
      return {  
        ...meal,  
        participantCount,  
        dishCount  
      };  
    }));  
  
    console.log("云函数cloudGetMealsByRate返回结果为：",mealsWithDetails);  
  
    return {   
      data: {  
        meals: mealsWithDetails,  
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