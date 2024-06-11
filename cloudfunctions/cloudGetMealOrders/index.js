// cloudGetMealOrders 云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV  // 使用当前动态云环境
})  // 初始化 cloud

exports.main = async (event, context) => {
  console.log("启动云函数cloudGetMealOrders,参数为：", event);
  const { mealId } = event; // 从 event 中获取 mealId
  if (!mealId) {
    return {
      success: false,
      errMsg: 'mealId 参数缺失'
    }
  }

  try {
    // 获取数据库引用
    const db = cloud.database();
    const UserMealOrders = db.collection('UserMealOrders');

    // 查询 UserMealOrders 集合中具有相同 mealId 的所有记录
    const result = await UserMealOrders
      .where({
        mealId: mealId
      })
      .get();

    if (result.data && result.data.length > 0) {
      // 将所有记录的 dishOrders 数组中的 dishId 合并为一个数组
      const allDishIds = result.data.reduce((allIds, order) => {
        return allIds.concat(order.dishOrders.map(dishOrder => dishOrder.dishId));
      }, []);
      console.log("云函数cloudGetMealOrders，查询到符合条件的订单allDishIds:", allDishIds);
      return {
        success: true,
        data: {
          dishIds: allDishIds // 返回合并后的 dishId 数组
        }
      }
    } else {
      return {
        success: false,
        errMsg: '没有找到对应的团餐订单'
      }
    }
  } catch (e) {
    console.error('云函数执行出错:', e);
    return {
      success: false,
      errMsg: e.toString()
    }
  }
}