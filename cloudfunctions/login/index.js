const cloud = require('wx-server-sdk');  
cloud.init({  
  env: cloud.DYNAMIC_CURRENT_ENV // 表示在当前云环境中操作  
});  
  
// 假设saveUserInfo云函数已经存在，并且它可以处理保存用户信息的逻辑  
async function callSaveUserInfo(openid) {  
  return await cloud.callFunction({  
    name: 'saveUserInfo',  
    data: {  
      openid: openid  
    }  
  });  
}  
  
exports.main = async (event) => {  
  const { code } = event;  
  if (!code) {  
    return {  
      error: 'Missing code'  
    };  
  }  
  
  try {  
    // 调用wxaCode2Session云函数来获取openid和session_key  
    const res = await cloud.callFunction({  
      name: 'wxaCode2Session',  
      data: {  
        code: code  
      }  
    });  
  
    if (res.result && res.result.openid) {  
      const openid = res.result.openid;  
      const userInfo = res.result.userInfo;
      console.log("openid:",openid,"userInfo:",userInfo)
        
      // 调用saveUserInfo云函数保存用户信息  
      const userInfoResult = await callSaveUserInfo(openid,userInfo);  
        
      if (userInfoResult.success) {  
        // saveUserInfo成功，返回用户信息或必要的字段  
        return {  
          success: true,  
          userId: userInfoResult.userId, // 假设saveUserInfo返回了userId  
          openid: openid  
        };  
      } else {  
        // saveUserInfo失败  
        return {  
          error: 'Failed to save user info',  
          userInfoResult: userInfoResult // 返回saveUserInfo的返回结果以便调试  
        };  
      }  
    } else {  
      return {  
        error: '获取openid失败'  
      };  
    }  
  } catch (error) {  
    // 请求发生错误  
    console.error(error);  
    return {  
      error: '登录失败'  
    };  
  }  
};