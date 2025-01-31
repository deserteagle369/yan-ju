// 引入云开发数据库
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { keyword } = event; // 获取用户输入的搜索关键词

  if (!keyword) {
    return {
      success: false,
      message: '关键词不能为空'
    };
  }

  try {
    // 使用正则表达式进行模糊搜索，匹配食材名称
    const result = await db.collection('ingredients')
      .where({
        Ingredient: db.RegExp({
          regexp: keyword,
          options: 'i' // 不区分大小写
        })
      })
      .get();

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('搜索食材失败:', error);
    return {
      success: false,
      message: '搜索失败，请稍后再试'
    };
  }
};