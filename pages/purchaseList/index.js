// pages/purchaseList/index.js
const base = require('../../utils/language.js')
const _ = base._
Page({
  data: {
      purchaseList: [],
      mealName: '',
      showZeroQuantity: false,
      mealDetail: null,
      _t: '',
  },

  onLoad: function(options) {
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('采购清单')
    })
    console.log("启动purchaseList页面,页面数据为:", this.data);
    if (options.listId) {
        this.loadPurchaseListById(options.listId);
    } else {
        wx.showToast({
            title: '无效的清单ID',
            icon: 'none',
            duration: 2000
        });
    }
  },

  refresh() {
    this.onLoad()
  },
  mixinFn() {
    this.setData({
      _t: base._t()
    })
  },
  loadPurchaseListById: function(listId) {
      wx.cloud.callFunction({
          name: 'cloudGetIngredientList',
          data: { listId: listId },
          success: res => {
              if (res.result && res.result.code === 0) {
                  this.setData({
                      purchaseList: res.result.data.ingredients,
                      mealId: res.result.data.mealId || '未命名餐单',
                      listId: res.result.data._id
                  });
                  this.getMealInfo(this.data.mealId);
              } else {
                  wx.showToast({
                      title: '获取采购清单失败',
                      icon: 'none'
                  });
              }
          },
          fail: err => {
              console.error('获取采购清单失败', err);
              wx.showToast({
                  title: '获取采购清单失败',
                  icon: 'none'
              });
          }
      });
  },

  getMealInfo: async function(mealId) {
    console.log("调用函数getMealDetails，参数为：", mealId);
    try {
      const result = await wx.cloud.callFunction({
        name: 'cloudGetMealsById',
        data: { mealId: mealId }
      });
  
      const { code, message, data } = result.result;  // 注意这里的 result.result
  
      if (code === 0) {
        this.setData({
          mealDetail: data.mealDetail,
          mealName: data.mealName,
          dishCount: data.dishCount,
          participantCount: data.participantCount,
          dishes: data.dishes,
          currentMealDishes: data.dishes.map(dish => dish._id),
        });
        console.log('purchaseList页面获取到的 mealDetail:', this.data.mealDetail);
        console.log('this.data.mealDetail.mealName:', this.data.mealDetail.mealName);
      } else {
        wx.showToast({
          title: message,
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('获取团餐详情失败:', err);
      wx.showToast({
        title: '获取团餐详情失败',
        icon: 'none',
        duration: 2000
      });
    }
  },
  toggleShowZeroQuantity: function(e) {
      console.log('toggleShowZeroQuantity:', e.detail.value);
      this.setData({
          showZeroQuantity: e.detail.value
      });
  },

  onShareAppMessage: function () {
      const mealName = mealDetail.mealName || '未命名餐单';
      const listId = this.data.listId || '';
      return {
          title: `${mealName}-采购清单`,
          path: '/pages/purchaseList/index?listId=' + listId,
          imageUrl: '/assets/share-ingredients.jpg'
      };
  },
});
