// 更新字段名的云函数cloudBatchChangeFieldName
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 云函数环境
})

exports.main = async (event, context) => {
  const { oldFieldName, newFieldName } = event; // 从 event 中获取旧字段名和新字段名
  const db = cloud.database();
console.log("云函数cloudBatchChangeFieldName收到参数：", event);
  try {
    const res = await db.collection('dishes').update({
      updates: [{
        // 使用 $rename 操作来重命名字段
        $rename: {
          [oldFieldName]: newFieldName
        }
      }]
    });

    return {
      success: true,
      data: res,
      errMsg: 'Fields renamed successfully.'
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.toString()
    };
  }
};