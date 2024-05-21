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
        // if (!mealId || !openid || !dishId || !dishQuantity) {  
        //     throw new Error('参数错误：请提供mealId, openid, dishId, dishQuantity');  
        // } 
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
        orderRecord.dishOrders[dishIndex].quantity = updatedQuantity;  

        // 构造更新数据  
        const updateData = {  
            data: {  
            'dishOrders.$.quantity': updatedQuantity, // 使用位置操作符 $ 来更新数组中的特定元素  
            },  
        };  
            
        // 构造更新条件（需要确保能够唯一标识要更新的数组元素）  
        const updateWhere = {  
            mealId,  
            openid,  
            'dishOrders.dishId': dishId, // 直接在查询条件中指定要更新的数组元素的字段  
        };  
            
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
    };  
    }  
};