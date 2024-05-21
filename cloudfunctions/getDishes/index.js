// 云函数 getDishes.js

// 云函数入口文件  
const cloud = require('wx-server-sdk')  
  
// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作
});
  
// 云函数入口函数  
exports.main = async (event, context) => {  
  try {  
    const db = cloud.database()  
    const collection = db.collection('dishes')  
  
    // 从 event 中获取关键字  
    const keyword = event.keyword || ''  
  
    // 使用正则表达式进行模糊匹配  
    const regex = new RegExp(keyword, 'i') // 'i' 表示不区分大小写  
  
    // 在 dishes 集合中搜索包含关键字的 dishName  
    const query = collection.where({  
      dishName: regex  
    })  
  
    // 获取匹配记录  
    const result = await query.get()  
  
    // 返回匹配记录  
    console.log("云端查询结果：",result)
    return result.data  
  } catch (error) {  
    // 发生错误时返回错误信息  
    console.error(error)  
    return { error: error.message }  
  }  
}