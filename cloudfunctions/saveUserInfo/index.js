const cloud = require('wx-server-sdk');  
  
// 初始化云环境  
cloud.init({  
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作  
});  
const db = cloud.database();  
  
exports.main = async (event, context) => {  
  const { openid, userInfo } = event; // 从事件对象中获取用户的openid和用户信息对象  
  
  if (!openid || !userInfo) {  
    return {  
      success: false,  
      message: '缺少必要的参数',  
      data: null  
    };  
  }  
  
  try {  
    // 查询用户是否已存在  
    const userQueryResult = await db.collection('users').where({ _openid: openid }).get();  
  
    if (userQueryResult.data.length > 0) {  
      // 用户已存在，更新用户信息  
      // 假设我们只想更新nickName和avatarUrl  
      const updateData = {  
        nickName: userInfo.nickName,  
        avatarUrl: userInfo.avatarUrl  
        // ... 其他需要更新的字段  
      };  
        
      const updateResult = await db.collection('users').doc(userQueryResult.data[0]._id).update({  
        data: updateData // 仅更新指定的字段  
      });  
  
      if (updateResult.stats.updated > 0) {  
        // 更新成功  
        return {  
          success: true,  
          message: '用户信息更新成功',  
          data: { updated: updateResult.stats.updated } // 返回更新影响的文档数量  
        };  
      } else {  
        // 未找到用户或用户信息未变化  
        return {  
          success: false,  
          message: '用户信息未更新或未找到匹配的用户',  
          data: null  
        };  
      }  
    } else {  
      // 用户不存在，保存新用户信息  
      const addUserResult = await db.collection('users').add({  
        data: { _openid: openid, ...userInfo } // 将openid与userInfo合并为一个新的对象进行插入，并确保_openid字段存在  
      });  
  
      if (addUserResult.id) {  
        // 新用户信息保存成功  
        return {  
          success: true,  
          message: '新用户信息保存成功',  
          data: { id: addUserResult.id } // 返回新生成的文档ID  
        };  
      } else {  
        // 新用户信息保存失败  
        return {  
          success: false,  
          message: '新用户信息保存失败',  
          data: null  
        };  
      }  
    }  
  } catch (error) {  
    console.error('保存或更新用户信息失败:', error);  
    return {  
      success: false,  
      message: '保存或更新用户信息失败',  
      data: null  
    };  
  }  
};