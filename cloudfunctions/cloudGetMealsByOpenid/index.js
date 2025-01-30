// functions/cloudGetMealsByOpenid.js
console.log("启动云函数cloudGetMealsByOpenid")
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
            '_openid': openid
          })
          .orderBy('date', 'desc')
          .get();
        break;
      case 'ended':
        queryResult = await db.collection('meals')
          .where({
            status: 'ended',
            '_openid': openid
          })
          .orderBy('date', 'desc')
          .get();
        break;
      case 'all':
        queryResult = await db.collection('meals')
          .where({
            '_openid': openid
          })
          .orderBy('date', 'desc')
          .get();
        break;
      default:
        throw new Error('Invalid meal type.');
    };
    console.log(queryResult);
    return {
      status: 'success',
      meals: queryResult.data
    };

  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      error: error.message,
    };
  }
};