//app.js//
App({
  globalData: {
    userInfo: null,
    openid: '',
    callbacks: [],  // 存储回调函数
    language: 'zh_CN' // 默认语言
  },

  // 获取用户openid，授权的情况下也可以获取userinfo
  onLaunch: function() {
    // 云开发的初始化
    wx.cloud.init({
      env: "yan-ju-9gnl8171f092d190",
      traceUser: "true"
    });
    this.getOpenid();
    // 添加错误处理
    wx.onError((err) => {
      console.error('App Error:', err);
      // 可以在这里添加全局的错误处理逻辑
    });
    // 假设从本地存储中读取语言设置
    const languageSetting = wx.getStorageSync('language') || 'zh_CN';
    this.globalData.language = languageSetting;
  },
  
  // 获取用户openid的逻辑
  getOpenid: function(retryCount = 3) {
    let app = this;
    wx.cloud.callFunction({
      name: "cloudGetOpenid",
      success(res) {
        let openid = res.result.openid;
        app.globalData.openid = openid;
        wx.setStorageSync('openid', openid);
        app.checkAndUpdateUserInfo(openid);
      },
      fail(err) {
        console.error("获取openid失败", err);
        if (retryCount > 0) {
          setTimeout(() => {
            app.getOpenid(retryCount - 1);
          }, 1000);
        } else {
          app.showErrorToastUtils('获取用户信息失败，请检查网络后重试');
        }
      }
    });
  },

  // 检查并更新用户信息
  // 检查并更新或保存用户信息
  // 检查并更新或保存用户信息
  checkAndUpdateUserInfo: function(openid) {
    let app = this;
    const userDB = wx.cloud.database().collection("users");

    userDB.doc(openid).get({
      success: function(res) {
        console.log("用户信息已存在", res.data);
        if (res.data) {
          // 更新全局变量和本地存储
          app.updateGlobalUserInfo({
            nickName: res.data.nickName,
            avatarUrl: res.data.avatarUrl,
            openid: openid  // 确保openid也被保存和更新
          });
        } else {
          console.log("记录存在，但没有找到期望的数据字段");
        }
      },
      fail: function() {
        console.log("用户信息不存在，需要新建");
        // 创建新用户
        let newUser = {
          _id: openid,
          avatarUrl: '../../images/default-avatar.png', // 默认头像
          nickName: '用户' + openid.slice(-4) // 默认昵称
        };
        userDB.add({
          data: newUser,
          success: function(res) {
            console.log("用户信息创建成功", res);
            app.updateGlobalUserInfo(newUser);
            wx.setStorageSync('user', newUser);
          },
          fail: function(err) {
            console.error("创建用户信息失败", err);
          }
        });
      }
    });
  },

 // 注册回调函数
 registerCallback: function(callback) {
  if (typeof callback === 'function') {
    this.globalData.callbacks.push(callback);
  }
},
  
 // 更新用户信息，并触发所有注册的回调
 updateGlobalUserInfo: function(userInfo) {
  this.globalData.userInfo = userInfo;
  wx.setStorageSync('user', userInfo);
  this.globalData.callbacks.forEach(callback => callback(userInfo));
},

  

// 创建新用户
  createNewUser: function(openid) {
    let app = this;
    const userDB = wx.cloud.database().collection("users");
    let userData = {
      _id: openid,
      avatarUrl: '../../images/default-avatar.png',
      nickName: '用户' + openid.slice(-4)
    };

    userDB.add({
      data: userData,
      success: function(res) {
        console.log("用户信息创建成功", res);
        app.globalData.userInfo = userData;
      },
      fail: function(err) {
        console.error("创建用户信息失败", err);
      }
    });
  },

  // 错误提示
  showErrorToastUtils: function(e) {
    wx.showModal({
      title: '提示！',
      confirmText: '朕知道了',
      content: e,
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定')
        }
      }
    })
  },
  // 打开权限设置页提示框
  _showSettingToast: function(e) {
    wx.showModal({
      title: '提示！',
      confirmText: '去设置',
      content: e,
      success: function(res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '../setting/setting',
          });
        }
      }
    });
  },

  // 获取当前时间，返回时间格式：2018-09-16 15:43:36
  getNowFormatDate: function() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
      strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate +
      " " + date.getHours() + seperator2 + date.getMinutes() +
      seperator2 + date.getSeconds();
    return currentdate;
  },
});