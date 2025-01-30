// pages/createMeal/index.js
const app = getApp();
const base = require('../../utils/language.js')
const _ = base._
Page({
  data: {
    mealName: '',
    date: '', // 团餐日期
    deadline: '', // 截止时间
    mealTypes: ['早餐', '中餐', '晚餐', '夜宵'],
    selectedMealTypeIndex: 2, // 默认为晚餐
    _t: '',
  },

  onLoad: function(options) {
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('创建团餐')
    })
    const app = getApp();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = `${tomorrow.getFullYear()}-${('0' + (tomorrow.getMonth() + 1)).slice(-2)}-${('0' + tomorrow.getDate()).slice(-2)}`;
    this.setData({
        date: dateString,
        mealName: dateString + ' 晚餐',
    });
  },

  refresh() {
    this.onLoad()
  },
  mixinFn() {
    this.setData({
      _t: base._t()
    })
  },
  // 当用户选择日期
  bindDateChange: function(e) {
    const newDate = e.detail.value;
    const mealType = this.data.mealTypes[this.data.selectedMealTypeIndex];
    this.setData({
        date: newDate,
        mealName: newDate + ' ' + mealType
    });
},

  // 当用户选择时间
  bindTimeChange: function(e) {
    this.setData({
        deadline: e.detail.value
    });
},

  // 当用户选择团餐类型
  bindMealTypeChange: function(e) {
    const newMealTypeIndex = e.detail.value;
    const newMealType = this.data.mealTypes[newMealTypeIndex];
    this.setData({
        selectedMealTypeIndex: newMealTypeIndex,
        mealName: this.data.date + ' ' + newMealType
    });
  },

  // 当用户输入团餐名称
  inputMealName: function(event) {
    this.setData({
      mealName: event.detail.value
    });
  },

  clearInput: function() {
    this.setData({
        mealName: ''
    });
  },

  // 创建团餐的函数
  createMeal: function() {
    const app = getApp();
    const openid = app.globalData.openid; // 获取用户的openid
    const { mealName, date, deadline, mealType } = this.data;
  
    if (!mealName || !date || !deadline) {
      wx.showToast({
        title: '请填写完整的团餐信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    wx.cloud.callFunction({
      name: 'cloudCreateMeal',
      data: {
        openid: openid, // 包含openid以确定创建者
        mealName: mealName,
        date: date,
        deadline: deadline,
        mealType: mealType,
        status: 'ongoing' // 默认状态为进行中
      },
      success: res => {
        if (res.result && res.result.success) {
          wx.showToast({
            title: '团餐创建成功',
            icon: 'success',
            duration: 2000
          });
          // 可以选择重定向到首页或团餐详情页
          wx.redirectTo({
            url: '/pages/mealDetail/index?mealId=' + res.result.mealId
          });
        } else {
          wx.showToast({
            title: '创建失败: ' + (res.result.error || '未知错误'),
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('调用创建团餐云函数失败:', err);
        wx.showToast({
          title: '网络错误，创建失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});
