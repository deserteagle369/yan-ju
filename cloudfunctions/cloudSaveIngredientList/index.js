// 云函数 cloudSaveIngredientList
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { mealId, ingredients } = event
  const now = new Date()

  const ingredientList = {
    mealId,
    updatedAt: now,
    lastUpdatedBy: OPENID,
    ingredients: ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      category: ing.category,
      subcategory: ing.subcategory,
      quantity: ing.quantity,
      unit: ing.unit
    }))
  }

  try {
    const existingList = await db.collection('IngredientLists').where({ mealId }).get()
    
    if (existingList.data.length > 0) {
      // 更新现有记录
      await db.collection('IngredientLists').doc(existingList.data[0]._id).update({
        data: ingredientList
      })
      return { success: true, message: '食材清单已更新' }
    } else {
      // 创建新记录
      ingredientList.createdAt = now
      ingredientList.createdBy = OPENID
      await db.collection('IngredientLists').add({
        data: ingredientList
      })
      return { success: true, message: '食材清单已保存' }
    }
  } catch (error) {
    console.error(error)
    return { success: false, message: '操作失败', error }
  }
}