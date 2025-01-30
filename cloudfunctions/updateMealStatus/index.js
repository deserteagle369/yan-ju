const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const { mealId, status } = event;
    const db = cloud.database();
    await db.collection('meals').doc(mealId).update({
      data: {
        status: status
      }
    });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
}
