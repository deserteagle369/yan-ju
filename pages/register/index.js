Page({
  data: {
    userInfo: null,
  },

  onLoginSuccess: function(e) {
    if (e.detail.userInfo) {
      // Successfully retrieved user information
      this.setData({
        userInfo: e.detail.userInfo,
      });

      // Optionally save user information to local storage
      wx.setStorageSync('userInfo', e.detail.userInfo);

      // Call the cloud function or your backend API to send openid and user information to the server for registration or login
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          // Here, process the logic after successful login, such as redirecting to the home page
          // This example directly navigates to the phone number binding page
          if (res.result.openid) {
            wx.navigateTo({
              url: '/pages/register/bindPhone',
            });
          } else {
            // In case there is no openid returned
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none',
              duration: 2000,
            });
          }
        },
        fail: err => {
          console.error('登录失败：', err);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none',
            duration: 2000,
          });
        },
      });
    } else {
      // User declined authorization
      wx.showToast({
        title: '授权登录失败，请重试',
        icon: 'none',
        duration: 2000,
      });
    }
  },
});
