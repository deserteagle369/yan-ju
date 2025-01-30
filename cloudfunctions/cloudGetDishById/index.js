// cloudGetDishByID/index.js  
  
// 云函数入口文件  
const cloud = require('wx-server-sdk')  
  
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 云函数环境
})
  
// 云函数入口函数  
exports.main = async (event, context) => {  
  console.log("启动云函数cloudGetDishById,参数为：", event);
  try {  
    // 调用数据库查询接口  
    const db = cloud.database()  
    const collection = db.collection('dishes')  
    // 从 event 中的dishIds数组中获取传入的菜品 ID  
    const dishIds = event.dishIds || [] // 假设前端传入的是 { "dishIds": ["菜品ID1", "菜品ID2", "菜品ID3"] }  
    console.log('云函数cloudGetDishById收到dishId:', dishIds)
    if (dishIds.length === 0) {
      return {
        error: 400,
        errMsg: '缺少必要的参数：dishIds'
      }   
    }
  
    // 根据dishIds数组中的菜品 ID，查询菜品
    const result = await collection
      .where({
        _id: db.command.in(dishIds)
      })
      .get()
  
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.toString()
    }
  }
}