// 引入云开发SDK
const cloud = require('wx-server-sdk')
cloud.init({
  // 表明云函数运行在哪个环境
  env: cloud.DYNAMIC_CURRENT_ENV
})
// 云函数入口函数
exports.main = async (event, context) => {
    const db = cloud.database()
    const { name, ingredients, time, spicyLevel } = event

    try {
        // 向数据库中添加菜品信息
        return await db.collection('dishes').add({
            data: { name, ingredients, time, spicyLevel }
        })
    } catch (e) {
        console.error(e)
        return e
    }
}
