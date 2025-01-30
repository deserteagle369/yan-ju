// 云函数 cloudCreateMeal/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 自动获取当前环境
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { mealName, date, deadline, mealType } = event
  // 获取调用此函数的用户的 openid
  const { OPENID } = cloud.getWXContext()

  try {
    const result = await db.collection('meals').add({
      data: {
        mealName: mealName,
        date: date,
        deadline: deadline,
        mealType: mealType,
        createdAt: db.serverDate(), // 使用服务器时间
        status: 'ongoing', // 默认状态为进行中
        participants: [], // 初始化参与者为空数组
        _openid: OPENID, // 创建者的openid
      }
    })

    return {
      success: true,
      mealId: result._id, // 返回创建的团餐的 ID
      message: '云函数cloudCreateMeal团餐创建成功'
    }
  } catch (error) {
    console.error('云函数cloudCreateMeal创建团餐失败', error)
    return {
      success: false,
      error: error
    }
  }
}
