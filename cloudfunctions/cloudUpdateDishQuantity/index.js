// 云函数 cloudUpdateDishQuantity/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV  // 云函数环境
});

exports.main = async (event, context) => {
  const { mealId, dishId, dishQuantity } = event;
  const db = cloud.database();
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查询所有包含该 mealId 的订单
    const ordersQuery = db.collection('UserMealOrders').where({ mealId });
    const ordersResult = await ordersQuery.get();

    // if (ordersResult.data.length === 0) {
    //   throw new Error('未找到对应的团餐订单');
    // }

    let dishFound = false;
    let orderToUpdate = null;
    // 遍历所有订单以查找包含该菜品的记录
    ordersResult.data.forEach(order => {
      const index = order.dishOrders.findIndex(dish => dish.dishId === dishId);
      if (index !== -1) {
        dishFound = true;
        orderToUpdate = order;
        // 更新菜品数量
        order.dishOrders[index].quantity = parseInt(dishQuantity, 10);
        if (order.dishOrders[index].quantity === 0) {
          // 如果数量更新为0，则移除该菜品
          order.dishOrders.splice(index, 1);
        }
      }
    });

    // 如果未找到菜品
    if (!dishFound) {
      // 查找当前用户的订单记录
      orderToUpdate = ordersResult.data.find(order => order.openid === openid);
      // 如果当前用户没有订单记录，创建一个新的
      if (!orderToUpdate) {
        orderToUpdate = {
          mealId: mealId,
          openid: openid,
          dishOrders: [{
            dishId: dishId,
            quantity: parseInt(dishQuantity, 10)
          }]
        };
        // 添加新订单到数据库
        await db.collection('UserMealOrders').add({
          data: orderToUpdate
        });
      } else {
        // 向现有订单添加菜品
        orderToUpdate.dishOrders.push({
          dishId: dishId,
          quantity: parseInt(dishQuantity, 10)
        });
        // 更新数据库中的订单记录
        await db.collection('UserMealOrders').doc(orderToUpdate._id).update({
          data: {
            dishOrders: orderToUpdate.dishOrders
          }
        });
      }
    } else {
      // 更新找到的订单记录
      await db.collection('UserMealOrders').doc(orderToUpdate._id).update({
        data: {
          dishOrders: orderToUpdate.dishOrders
        }
      });
    }

    return {
      code: 0,
      message: '更新菜品数量成功'
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    };
  }
};
