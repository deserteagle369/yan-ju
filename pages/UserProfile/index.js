const app = getApp();
let openid;

// Import or initialize the database SDK (assuming you've already set up the SDK)
const db = wx.cloud.database();
console.log("app.globalData.openid:",app.globalData.openid);
function saveUserProfile(user) {
  console.log("hello")
  // Prepare the user profile data to be saved
  const userProfile = {
    avatarUrl: '../../images/user.png', // Default avatar URL
    nickName: app.globalData.openid.slice(-4), // Shortened OpenID as the nickname
    // Add any other relevant user data you want to store
  };
  // Update the user document in the cloud database
  console.log("userProfile.nickName:",userProfile.nickName);
  db.collection('users') // Replace 'users' with the actual collection name for your users
    .where({ openid: app.globalData.openid }) // Query by the user's OpenID
    .update({
      data: userProfile,
      success: () => {
        console.log('User profile updated successfully in the cloud database.');
      },
      fail: (error) => {
        console.error('Failed to update user profile in the cloud database:', error);
      },
    });
};

Page({
  // 页面的初始数据
  data: {
    isShowUserName: false,
    userInfo: null,
    openid: "",
    shortenedOpenid: ""
  },

  // button获取用户信息
  onGotUserInfo: function(e) {
    // 如果用户拒绝授权，提示并引导开启授权
    if (!e.detail.userInfo) {
      app._showSettingToast('登陆需要允许授权');
    };
    if (e.detail.userInfo) {
      console.log("onGotUserInfo中的e.detail.userinfo:", e.detail.userInfo);
      let user = e.detail.userInfo;
      let avatarUrl = '../../images/user.png'; // Set the default avatar if needed
      user.avatarUrl = avatarUrl;
      this.setData({
        isShowUserName: true,
        userInfo: user,
      });
      console.log("onGotUserInfo中的app.globalData.openid:", app.globalData.openid);
      user.openid = app.globalData.openid;
      console.log("onGotUserInfo中的app.globalData.nickName:", app.globalData.nickName);
      // Save the user's profile information to the cloud database
      console.log("调用saveUserProfile，参数：",user)
      saveUserProfile(user);
      console.log("调用app_saveUserInfo，参数：",user)
      // app._saveUserInfo(user);
    } else {
            // 用户未授权，提示并引导开启授权
            app._showSettingToast('登陆需要允许授权');
            wx.openSetting({
              success: (res) => {
                console.log('用户授权设置成功:', res.authSetting);
                // 用户返回后，重新检查并处理用户授权状态
                if (res.authSetting['scope.userInfo']) {
                  this.setData({ isShowAuthorizeButton: false }); // 隐藏或修改授权按钮状态
                  // 可以在这里调用_app._getUserInfo()更新用户信息
                } else {
                  console.log('用户未开启授权');
                }
              },
              fail: (err) => {
                console.error('打开授权设置失败:', err);
              },
            });
          }
  },

  loginOut() {
    app._saveUserInfo(null);
    this.setData({
      isShowUserName: false
    });
  },

  // 生命周期函数--监听页面加载
  onLoad: function(options) {
    openid = app.globalData.openid;
    console.log("openid:", openid);
    var that = this;
    that.setData({
      openid: openid,
    });
    var user = app.globalData.userInfo;
    if (user) {
      that.setData({
        isShowUserName: true,
        userInfo: user,
      });
      handleOpenidSlicing(user, that);
    } else {
      app.userInfoReadyCallback = res => {
        that.setData({
          userInfo: res.userInfo,
          isShowUserName: true
        });
        handleOpenidSlicing(res.userInfo, that);
      };
    };
    this.loadGroupMeals();
    function handleOpenidSlicing(userInfo) {
      if (userInfo && userInfo.openid) {
        let shortenedOpenid = userInfo.openid.slice(-4); // Extract the last 4 characters
        console.log("shortenedOpenid:", shortenedOpenid);
        that.setData({
          shortenedOpenid: shortenedOpenid, // Add a new property to hold the shortened openid
        });
      } else {
        console.warn('User object does not have an openid property. Skipping the slicing operation.');
      }
    };
  },
  async loadGroupMeals() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getMeals',
        data: {
          type: 'all' // 获取所有团餐
        }
      });

      if (result.result.status === 'success') {
        this.setData({
          groupMeals: result.result.meals
        });
      } else {
        console.error('加载团餐列表失败', result.result.error);
      }
    } catch (error) {
      console.error('调用getMeals云函数失败', error);
    }
  },

  /**
   * 跳转至团餐详情页
   * @param {Object} e - 事件对象，包含团餐ID
   */
  goToMealDetail(e) {
    const mealId = e.currentTarget.dataset.mealId;
    wx.navigateTo({
      url: `/pages/MealDetail/index?mealId=${mealId}`,
    });
  },
  onUnload: function() {
    // 取消注册授权状态变更监听器
    wx.offAuthSettingChange(app.onAuthChangeCallback);
  },
})
