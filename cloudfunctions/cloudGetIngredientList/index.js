// 云函数cloudGetIngredientList入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
    const { mealId, listId } = event
    
    try {
        let result;
        if (listId) {
            result = await db.collection('IngredientLists').doc(listId).get()
        } else if (mealId) {
            result = await db.collection('IngredientLists').where({
                mealId: mealId
            }).get()
        } else {
            return {
                code: -1,
                message: '缺少必要的参数'
            }
        }
        
        if (result.data && (result.data.length > 0 || result.data._id)) {
            return {
                code: 0,
                data: Array.isArray(result.data) ? result.data[0] : result.data
            }
        } else {
            return {
                code: -1,
                message: '未找到对应的食材清单'
            }
        }
    } catch (err) {
        console.error(err)
        return {
            code: -1,
            message: '获取食材清单失败'
        }
    }
}
