// 云函数名称: getMealsByOpenid
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { openid } = event;
  
  try {
    const db = cloud.database();
    
    // 分别查询用户创建的团餐和参与的团餐
    const createdMeals = await db.collection('meals')
                                  .where({ _openid: openid }) // 用户创建的团餐
                                  .get();
                                  
    const participatedMeals = await db.collection('meals')
                                       .where('participantOrders.openid', openid)
                                       .get();
                                      
    // 过滤掉重复的团餐（如果用户同时是创建者也是参与者）
    const uniqueParticipatedMealIds = new Set(participatedMeals.data.map(meal => meal._id));
    const distinctParticipatedMeals = participatedMeals.data.filter(meal => !uniqueParticipatedMealIds.has(meal._id));
    
    // 合并并返回结果
    const allMeals = [...createdMeals.data, ...distinctParticipatedMeals];
    
    // 可以根据需要进一步整理数据结构，例如增加类型标记
    const mealsWithType = allMeals.map(meal => ({
      ...meal,
      type: createdMeals.data.includes(meal) ? 'created' : 'participated',
    }));
    
    return { data: mealsWithType };
  } catch (e) {
    return { error: `获取用户相关团餐列表失败: ${e.message}` };
  }
};