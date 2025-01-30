// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV  // 使用当前环境的云数据库
})

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const mealId = event.mealId

  console.log("接收到的mealId:", mealId);  // 调试信息

  try {
    const res = await db.collection('meals').doc(mealId).remove()
    console.log("数据库操作返回:", res);  // 调试信息
    return {
      status: 'success',
      message: '团餐删除成功',
      data: res
    }
  } catch (err) {
    console.error("删除操作错误:", err)  // 调试信息
    return {
      status: 'error',
      message: '团餐删除失败',
      error: err
    }
  }
}
