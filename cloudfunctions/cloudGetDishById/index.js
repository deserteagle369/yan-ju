// cloudGetDishByID/index.js  
  
// 云函数入口文件  
const cloud = require('wx-server-sdk')  
  
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 云函数环境
})
  
// 云函数入口函数  
exports.main = async (event, context) => {  
  try {  
    // 调用数据库查询接口  
    const db = cloud.database()  
    const collection = db.collection('dishes')  
    // 从 event 中获取传入的菜品 ID  
    const dishId = event.dishId || '' // 假设前端传入的是 { "dishId": "具体的菜品ID" }  
    console.log('云函数cloudGetDishById收到dishId:', dishId)
    if (!dishId) {  
      return {  
        error: 400,  
        errMsg: '缺少必要的参数：dishId'  
      }  
    }  
  
    // 根据 ID 查询菜品  
    const result = await collection.doc(dishId).get()  
    console.log('云函数cloudGetDishById查询结果：', result)
    // 检查是否查询到结果  
    if (result.data) {  
      // 返回查询到的菜品信息  
      return result.data
    } else {  
      return {  
        error: 404,  
        errMsg: '未找到指定的菜品'  
      }  
    }  
  } catch (err) {  
    // 打印错误堆栈  
    console.error(err)  
    return {  
      error: 500,  
      errMsg: '内部错误'  
    }  
  }  
}