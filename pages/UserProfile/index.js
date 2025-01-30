const app = getApp();
const base = require('../../utils/language.js')
const _ = base._
Page({
  // 页面的初始数据
  data: {
    userInfo: null,
    hasUserInfo: false,
    meals: [], // 团餐列表
    languages: [
      { code: 'zh_CN', name: '简体中文' },
      { code: 'zh_TW', name: '繁体中文' },
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'es', name: 'Español' }
    ],
    currentLangIndex: 0,
    currentLangName: '简体中文',
    _t: '',
  },

  onLoad: function() {
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('个人中心')
    })
    this.checkUserInformation();
    this.getUserInfo();  // 调用getUserInfo来加载用户数据
    this.loadGroupMeals();
    // 注册回调来更新页面数据
    app.registerCallback(this.updateUserInfo);
  },

  onPullDownRefresh: function() {
    // 显示下拉刷新提示
    wx.showNavigationBarLoading(); // 在标题栏中显示加载
    wx.showLoading({
      title: '正在刷新...',
      mask: true
    });

    // 执行刷新数据的逻辑
    this.refreshData().then(() => {
      wx.hideNavigationBarLoading(); // 完成时隐藏加载
      wx.hideLoading(); // 完成时隐藏加载提示
      wx.stopPullDownRefresh(); // 停止下拉刷新
    }).catch((error) => {
      console.error('刷新数据失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
      wx.hideNavigationBarLoading(); // 失败时隐藏加载
      wx.hideLoading(); // 失败时隐藏加载提示
      wx.stopPullDownRefresh(); // 停止下拉刷新
    });
  },
  refreshData: function() {
    // 这里返回一个 Promise，以便在数据刷新完成后执行后续操作
    return Promise.all([
      this.getUserInfo(),
      this.loadGroupMeals(),
    ]);
  },
  refresh() {
    this.onLoad()
  },
  mixinFn() {
    this.setData({
      _t: base._t()
    })
  },
  // 更新页面上的用户信息
  updateUserInfo: function(userInfo) {
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true
    });
  },

  getUserInfo: function() {
    const app = getApp();
    const openid = app.globalData.openid || wx.getStorageSync('user').openid;
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {
        openid: openid
      },
      success: res => {
        if (res.result.data) {
          this.setData({
            userInfo: res.result.data,
            hasUserInfo: true
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('获取用户信息失败:', err);
      }
    });
  },
  checkUserInformation: function() {
    let userInfo = app.globalData.userInfo;
    if (userInfo) {
      console.log("从全局变量获取用户信息：", userInfo);
      this.setUserInfo(userInfo);
    } else {
      console.log("全局没有用户信息，尝试从本地缓存获取用户信息");
      userInfo = wx.getStorageSync('user');
      if (userInfo) {
        console.log("从本地缓存获取用户信息成功：", userInfo);
        app.globalData.userInfo = userInfo;  // 更新全局变量
        this.setUserInfo(userInfo);
      } else {
        console.log("本地缓存中无用户信息");
        app.getOpenid();
      }
    }
  },

  setUserInfo: function(userInfo) {
    // 更新页面上的用户信息
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true
    });
  },

  onWeChatLogin: function() {
    if (!this.data.hasUserInfo) {
      app.getOpenid();
    }
  },

  onChooseAvatar: function(e) {
    const that = this;
    if (e.detail.avatarUrl) {
      // 选择图片成功后，首先上传到云存储
      const filePath = e.detail.avatarUrl;
      const cloudPath = 'userAvatar/' + app.globalData.openid + Date.now() + filePath.match(/\.[^.]+?$/)[0];

      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: res => {
          // 获取上传后的文件ID
          const fileID = res.fileID;
          console.log('上传头像成功:', fileID);
          
          // 更新页面上的数据
          that.setData({
            'userInfo.avatarUrl': fileID
          });

          // 更新用户头像信息到数据库
          that.updateUserInfoInDB({
            avatarUrl: fileID
          });
        },
        fail: e => {
          console.error('上传头像失败:', e);
          wx.showToast({
            icon: 'none',
            title: '上传失败'
          });
        }
      });
    }
  },

  formsubmit: function(e) {
    const nickName = e.detail.value.nickname;
    console.log("nickName", nickName)
    if (nickName) {
      this.setData({
        'userInfo.nickName': nickName
      });
      // 更新用户昵称信息到数据库
      this.updateUserInfoInDB({ nickName: nickName });
    }
  },

  updateUserInfoInDB: function(userInfo) {
    const db = wx.cloud.database();
    const userDB = db.collection("users");
    const openid = app.globalData.openid; // 确保在全局数据中已有openid

    userDB.doc(openid).update({
      data: userInfo,
      success: function(res) {
        console.log("用户信息更新成功", res);
        app.globalData.userInfo = Object.assign({}, app.globalData.userInfo, userInfo);
        // 可以选择在此显示更新成功的提示
        wx.showToast({
          title: '信息更新成功',
          icon: 'success'
        });
      },
      fail: function(err) {
        console.error("用户信息更新失败", err);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    });
  },

  loginOut: function() {
    // 清除本地用户信息和全局用户信息
    wx.removeStorageSync('user');
    app.globalData.userInfo = null;
    app.globalData.meals = []; // 清除全局团餐列表
    this.setData({
      hasUserInfo: false,
      userInfo: null,
      meals: [] // 清除页面上的团餐列表
    });
  },

  async loadGroupMeals() {
    const openid = this.data.userInfo.openid; // 从页面数据获取当前用户的openid
    if (!openid) {
      console.log("未获取到用户openid，无法加载团餐");
      return;
    }
    try {
      const result = await wx.cloud.callFunction({
        name: 'cloudGetMealsByOpenid',
        data: {
          type: 'all',
          openid: openid, // 按 openid 排序
        }
      });
      console.log("cloudGetMealsByOpenid返回结果：",result.result);
      if (result.result.status === 'success') {
        this.setData({
          meals: result.result.meals
        });
      } else {
        console.error('加载团餐列表失败', result.result.error);
      }
    } catch (error) {
      console.error('调用cloudGetMealsByOpenid云函数失败', error);
    }
  },

  goToMealDetail(e) {
    const mealId = e.currentTarget.dataset.mealId;
    wx.navigateTo({
      url: '/pages/mealDetail/index?mealId=' + mealId + '&mode=view',
    });
  },

  onUnload: function() {
    // 取消注册授权状态变更监听器
    wx.offAuthSettingChange(app.onAuthChangeCallback);
  },

  deleteMeal: function(e) {
    const mealId = e.currentTarget.dataset.id;
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个团餐吗？',
      success (res) {
        if (res.confirm) {
          console.log('用户点击:',mealId);
          // 调用云函数或API删除团餐
          wx.cloud.callFunction({
            name: 'cloudDeleteMeal', // 假设有一个云函数处理删除逻辑
            data: {
              mealId: mealId
            },
            success: function() {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000
              });
              // 这里可以重新加载团餐列表，或者动态移除已删除的项
              const updatedMeals = that.data.meals.filter(meal => meal._id !== mealId);
              that.setData({
              meals: updatedMeals
              });
            },
            fail: function() {
              wx.showToast({
                title: '删除失败',
                icon: 'error',
                duration: 2000
              });
            }
          });
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
});