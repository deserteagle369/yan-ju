// functions/getMeals.js
console.log("启动云函数getMeals")
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const db = cloud.database();
    const openid = cloud.getWXContext().OPENID;
    console.log("为用户查询团餐：", openid)

    let queryResult;
    switch (event.type) {
      case 'ongoing':
        queryResult = await db.collection('meals')
          .where({
            status: 'ongoing',
            'participantOrders.openid': openid
          })
          .orderBy('date', 'desc')
          .get();
        break;
      case 'ended':
        queryResult = await db.collection('meals')
          .where({
            status: 'ended',
            'participantOrders.openid': openid
          })
          .orderBy('date', 'desc')
          .get();
        break;
      case 'all':
        queryResult = await db.collection('meals')
          .where({
            'participantOrders.openid': openid
          })
          .orderBy('date', 'desc')
          .get();
        break;
      default:
        throw new Error('Invalid meal type.');
    }

    const meals = queryResult.data.map(meal => {
      const participantOrder = meal.participantOrders.find(order => order.openid === openid);
      return {
        ...meal,
        participantDishIds: participantOrder ? participantOrder.dishIds : []
      };
    });

    return {
      status: 'success',
      meals
    };

  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      error: error.message,
    };
  }
};