// 引入所需依赖
import wxRequest from '../../utils/wxRequest'; // 假设这是一个封装好的发送请求的方法

Page({
  data: {
    // 页面数据（如有需要）
  },

  async onLoad() {
    // 加载页面时，先获取用户登录态
    const loginRes = await wx.login({
      success: (loginRes) => {
        this.globalData.loginCode = loginRes.code;
      },
      fail: (err) => {
        console.error('获取登录凭证失败：', err);
      },
    });
  },

  async onGetPhoneNumber(e) {
    if (e.detail.encryptedData && e.detail.iv) {
      try {
        // 使用登录凭证code换取session_key和openid
        const sessionRes = await wxRequest({
          url: '/api/sessionKey', // 替换为获取session_key的实际API地址
          method: 'POST',
          data: {
            code: this.globalData.loginCode,
          },
        });

        // 发送加密数据和iv到后端解密并绑定手机号
        const bindPhoneRes = await wxRequest({
          url: '/api/bindPhoneNumber', // 替换为绑定手机号的实际API地址
          method: 'POST',
          data: {
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv,
            sessionKey: sessionRes.data.sessionKey,
            // 其他可能需要的参数（如openid等）
          },
        });

        if (bindPhoneRes.success) {
          wx.showToast({
            title: '手机号绑定成功',
            icon: 'success',
            duration: 2000,
          });

          // 绑定成功后，执行后续操作（如跳转到其他页面）
        } else {
          wx.showToast({
            title: '手机号绑定失败，请重试',
            icon: 'none',
            duration: 2000,
          });
        }
      } catch (err) {
        console.error('绑定手机号过程中发生错误：', err);
        wx.showToast({
          title: '网络异常，请稍后再试',
          icon: 'none',
          duration: 2000,
        });
      }
    } else {
      wx.showToast({
        title: '获取手机号失败，请重试',
        icon: 'none',
        duration: 2000,
      });
    }
  },
  
  globalData: {
    loginCode: null,
  },
});