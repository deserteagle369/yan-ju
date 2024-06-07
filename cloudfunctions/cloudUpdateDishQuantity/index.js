// 云函数 cloudUpdateDishQuantity/index.js  
const cloud = require('wx-server-sdk')  
  
cloud.init({ 
  env: cloud.DYNAMIC_CURRENT_ENV    // 云函数环境   
})  
  
exports.main = async (event, context) => {  
  try {  
        const wxContext = cloud.getWXContext()  
        const openid = wxContext.OPENID  
        console.log('openid:', openid)  

        // 假设 event 包含了 mealId, dishId, 和 quantityChange  
        const { mealId, dishId, dishQuantity } = event  
        console.log('event:', event) 
        console.log('mealId:', mealId)      
        console.log('dishId:', dishId)  
        console.log('dishQuantity:', dishQuantity)  
        console.log("openid:", openid)  
        // 获取数据库引用  
        const db = cloud.database()  
        // 构造查询条件  
        const query = db.collection('UserMealOrders').where({  
        mealId,  
        openid  
        });  

        // 获取团餐订单记录  
        const orderDoc = await query.get({ limit: 1 });  
        if (orderDoc.data.length === 0) {  
        throw new Error('未找到对应的团餐订单');  
        }  

        // 获取团餐订单详情  
        const orderRecord = orderDoc.data[0];  

        // 查找要更新的菜品索引  
        let dishIndex = orderRecord.dishOrders.findIndex(dish => dish.dishId.toString() === dishId.toString());  
        if (dishIndex === -1) {  
        throw new Error('未找到对应的菜品');  
        }  

        // 更新菜品数量  
        const updatedQuantity = parseInt(dishQuantity, 10);  
        if (isNaN(updatedQuantity) || updatedQuantity < 0) {  
        throw new Error('菜品数量必须是非负整数');  
        }  
        if (updatedQuantity === 0) {
                // 移除菜品
                orderRecord.dishOrders.splice(dishIndex, 1);
              } else {
        orderRecord.dishOrders[dishIndex].quantity = updatedQuantity;  
        }
        console.log('orderRecord:', orderRecord);
        // 更新数据库中的点餐记录  
        const updateResult = await db.collection('UserMealOrders').doc(orderDoc.data[0]._id).update({  
            data: {  
              dishOrders: orderRecord.dishOrders  
            }  
          });
          
        // 打印更新结果
        console.log('updateResult:', updateResult);
        
        // 返回更新结果
        if (updateResult.stats.updated > 0) {   
        return {  
            code: 0,  
            message: 'cloudUpdateDishQuantity更新菜品数量成功',  
        };  
        } else {  
        throw new Error('cloudUpdateDishQuantity更新菜品数量失败：' + updateResult.errMsg);  
        }  
        
    } catch (err) {   
    // 捕获并返回错误   
        return {
          code: -1,
          message: err.message, 
      } 
    
    } 
};  