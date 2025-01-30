//云函数cloudAddToMail/index.js
// 云函数入口文件    
const cloud = require('wx-server-sdk');  
  
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });  
  
// 云数据库    
const db = cloud.database();  
const _ = db.command;  
  
// 云函数入口函数    
exports.main = async (event, context) => {    
  try {    
    // 从事件对象中获取参数    
    const { mealId, openid, dishId, dishQuantity } = event;  
    
    // 检查参数是否齐全    
    if (!mealId || !openid || !dishId || !dishQuantity) {    
      throw new Error('参数不齐全');    
    }    
    
    // 构造点餐信息对象    
    const orderItem = {    
      dishId,    
      quantity: parseInt(dishQuantity, 10) // 转换为整数类型    
    };  
    
    // 构造查询条件    
    const query = db.collection('UserMealOrders').where({    
      mealId,    
      openid    
    });  
    
    // 查询当前用户是否已经有点餐记录    
    const orderDoc = await query.get({ limit: 1 });  
    
    if (orderDoc.data.length === 0) {    
      // 如果没有点餐记录，则新增一条    
      const result = await db.collection('UserMealOrders').add({  
        data: {    
          mealId,    
          openid,    
          dishOrders: [{
            dishId,
            quantity:parseInt(dishQuantity, 10) 
        }] // 初始点餐记录只包含一个菜品    
        }    
      });  
        
      // 打印新增结果    
      console.log('新增点餐记录成功:', result);  
        
      return {    
        code: 0,    
        message: '添加菜品到团餐成功',    
        recordId: result._id    
      };  
    } else {    
      // 如果已存在点餐记录，则更新菜品信息  
      // 先找到对应的菜品，然后更新数量  
      const orderRecord = orderDoc.data[0];  
      let dishIndex = -1;  
      for (let i = 0; i < orderRecord.dishOrders.length; i++) {  
        if (orderRecord.dishOrders[i].dishId === dishId) {  
          dishIndex = i;  
          break;  
        }  
      }  
        
      if (dishIndex !== -1) {  
        // 菜品存在，更新数量  
        const updatedQuantity = parseInt(dishQuantity, 10); // 确保数量为整数  
        orderRecord.dishOrders[dishIndex].quantity = updatedQuantity;  
      } else {  
        // 菜品不存在，添加到点餐记录中  
        orderRecord.dishOrders.push(orderItem);  
      }  
        
      // 更新数据库中的点餐记录  
      const updateData = {  
        // 只包含需要更新的字段  
        dishOrders: orderRecord.dishOrders  
      };  
      const updateResult = await db.collection('UserMealOrders').doc(orderDoc.data[0]._id).update({  
        data: updateData  
      });  
        
      // 打印更新结果  
      console.log('更新点餐记录成功:', updateResult);  
        
      return {    
        code: 0,    
        message: '更新菜品数量成功'    
      };  
    }  
  } catch (err) {  
    // 打印错误信息  
    console.error('处理点餐记录失败:', err);  
    return {  
      code: -1,  
      message: err.message || '处理点餐记录失败'  
    };  
  }  
};