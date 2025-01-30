// 本地函数 register/login/index.js

export default {
  login: async function() {
    try {
      // 调用微信登录接口获取code
      const res = await wx.login();
      if (res.code) {
        // 直接调用云函数进行下一步操作
        console.log("调用云函数login登录")
        const cloudRes = await wx.cloud.callFunction({
          name: 'login', // 云函数名称
          data: {
            code: res.code
          }
        });
        return cloudRes;
      } else {
        throw new Error('登录失败！' + res.errMsg);
      }
    } catch (error) {
      console.error('登录异常', error);
      throw error;
    }
  }
};