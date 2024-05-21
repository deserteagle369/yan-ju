// 云函数名称：cloudGetMealsById    
const cloud = require('wx-server-sdk');    
cloud.init({    
  env: cloud.DYNAMIC_CURRENT_ENV    
});    
    
exports.main = async (event, context) => {    
  const { mealId } = event;  
  console.log('启动cloudGetMealsById 参数:', event);  
  try {    
    const db = cloud.database();    
    
    // 第一步：从 Meals 集合中获取团餐的详细信息    
    const mealResult = await db.collection('meals').doc(mealId).get();   
    console.log("mealResult", mealResult);    
    if (!mealResult.data || mealResult.data.length === 0) {    
      throw new Error('cloudGetMealsById: 未找到团餐信息');    
    }    
    const mealDetail = mealResult.data;    
    console.log("mealDetail", mealDetail);
    
    // 第二步：从 UserMealOrders 集合中获取与 mealId 相关的菜品信息和参与人数      
    const userMealOrdersResult = await db.collection('UserMealOrders').where({    
      mealId: mealId    
    }).get();   
    
    // 初始化菜品数量映射  
    const dishQuantities = {};  
    console.log("userMealOrdersResult.data", userMealOrdersResult.data);
    // 遍历用户订单，统计每个菜品的数量  
    userMealOrdersResult.data.forEach(order => {  
      order.dishOrders.forEach(dishOrder => {  
        const dishId = dishOrder.dishId;  
        if (!dishQuantities[dishId]) {  
          dishQuantities[dishId] = 0; // 如果映射中还没有这个菜品ID，则初始化为0  
        }  
        dishQuantities[dishId] += dishOrder.quantity; // 累加数量  
      });  
    });  
  
    // 收集所有唯一的 dishId  
    const uniqueDishIds = new Set();  
    userMealOrdersResult.data.forEach(order => {  
      order.dishOrders.forEach(dishOrder => {  
        uniqueDishIds.add(dishOrder.dishId);  
      });  
    }); 

    // 将 Set 转换为 Array，因为查询通常需要 Array  
    const dishIdsArray = Array.from(uniqueDishIds); 

    // 查询 dishes 集合，获取所有 uniqueDishIds 对应的菜品信息  
    const dishesResult = await db.collection('dishes').where({  
      _id: db.command.in(dishIdsArray) // 假设 _id 是菜品的唯一标识符  
    }).get(); 

    // 构建包含 dishQuantity 的菜品列表  
    const finalDishes = dishesResult.data.map(dish => {  
      const quantity = dishQuantities[dish._id] || 0;  
      return {  
        ...dish, // 保留原始菜品信息  
        dishQuantity: quantity // 添加菜品数量  
      };  
    });   
    console.log("finalDishes", finalDishes);

    // 构建返回的数据    
    const result = {    
      code: 0, // 假设0表示成功    
      message: 'cloudGetMealsById 获取团餐信息成功',    
      data: {    
        mealDetail: mealDetail, // 团餐的详细信息    
        participantCount: userMealOrdersResult.data.length, // 参与点餐人的数量    
        dishCount: finalDishes.length, // 参与点餐的菜品数量    
        dishes: finalDishes // 菜品列表，包含dishQuantity    
      }    
    };    
    console.log('cloudGetMealsById 获取团餐信息成功:', result);
    // 返回数据    
    return result;  
  } catch (err) {  
    // 错误处理  
    console.error('cloudGetMealsById 查询团餐信息失败:', err);  
    return {  
      code: -1,  
      message: 'cloudGetMealsById 查询团餐信息失败',  
      error: err.message  
    };  
  }  
};