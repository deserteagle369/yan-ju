// pages/ingredients/index.js
const base = require('../../utils/language.js')
const _ = base._
const app = getApp();
Page({
    data: {
      mealId: '',
      mealDetails: {},
      ingredients: {},
      hasSaved: false, // 标志食材清单是否已保存
      units: ['份','斤', '千克', '个', '克', '条', '包', '瓶'],
      item: {
        unitIndex:0,
        unit: '份'
      },
      isCreator: true,
      isChef: true,
      includeZeroQuantity: false,
      shareLink: '',
      _t: '',
    },

    onLoad: function(options) {
      this.mixinFn();
      wx.setNavigationBarTitle({
        title: _('食材')
      })
      this.setData({
        mealId: options.mealId,
        'item.unitIndex': 0,
        'item.unit': this.data.units[0],
        // isChef: options.isChef === 'true'
        isChef: true
      });
      this.checkIfSaved(); // 检查是否已有保存的食材清单
      console.log("ingredients页面被打开，参数为：",this.data.mealId, "isChef:", this.data.isChef);
      this.getMealDetails(this.data.mealId);
      console.log('Units:', this.data.units);
      console.log("isCreator:", this.data.isCreator);
      console.log("isChef:", this.data.isChef);
      console.log("Ingredients:", this.data.ingredients);
    },
    
    refresh() {
      this.onLoad()
    },
    mixinFn() {
      this.setData({
        _t: base._t()
      })
    },
    onShow: function() {
      // 使用全局变量
      const mealId = getApp().globalData.mealId;
      console.log('ingredients页面获取到的 mealId:', this.data);
    },

    checkIfSaved: function() {
      // 检查云数据库中是否已有保存的食材清单
      wx.cloud.callFunction({
          name: 'cloudGetIngredientList',
          data: { mealId: this.data.mealId },
          success: res => {
              if (res.result && res.result.code === 0) {
                  this.setData({
                      hasSaved: true // 如果已有保存的清单，更新标志
                  });
              }
          },
          fail: err => {
              console.error('检查食材清单保存状态失败', err);
          }
      });
    },
    getMealDetails: async function(mealId) {
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
            dishCount: data.dishCount,
            participantCount: data.participantCount,
            dishes: data.dishes,
            currentMealDishes: data.dishes.map(dish => dish._id),
          });
          
          // 处理所有菜品的食材
          await this.processDishesAndIngredients(data.dishes);
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
    
    // 处理菜品和食材信息
    processDishesAndIngredients: async function(dishes) {
      console.log("处理菜品和食材信息，参数为：", dishes);
      const ingredientsMap = {};
      const allIngredientIds = dishes.flatMap(dish => dish.selectedIngredients);
    
      try {
        const db = wx.cloud.database();
        const _ = db.command;
        const ingredientsResult = await db.collection('ingredients').where({
          _id: _.in(allIngredientIds)
        }).get();
        const ingredientsDetails = ingredientsResult.data;
    
        dishes.forEach(dish => {
          // 更新每个菜品的详细信息
          this.updateDishDetails(dish);
    
          // 处理每个菜品的食材
          dish.selectedIngredients.forEach(ingredientId => {
            const ingredientDetail = ingredientsDetails.find(detail => detail._id === ingredientId);
            if (ingredientDetail) {
              const key = `${ingredientDetail.Category}-${ingredientDetail.Subcategory}-${ingredientDetail.Ingredient}`;
              if (!ingredientsMap[key]) {
                ingredientsMap[key] = {
                  id: ingredientDetail._id,
                  category: ingredientDetail.Category,
                  subcategory: ingredientDetail.Subcategory,
                  name: ingredientDetail.Ingredient,
                  quantity: 0,
                  unit: '份'
                };
              }
              // 更新数量，默认为dish的数量
              ingredientsMap[key].quantity += dish.dishQuantity || 1;
            }
          });
        });
        // 将ingredientsMap转换为数组，并确保每个元素都有quantity和unit
        const ingredients = Object.values(ingredientsMap).map(ingredient => ({
          ...ingredient,
          quantity: ingredient.quantity || 1,  // 如果quantity为0，设为1
          unit: ingredient.unit || '份'  // 确保每个食材都有单位
        }));
        this.setData({ 
          dishes: dishes,
          ingredients: ingredients 
        });
      } catch (err) {
        console.error('处理菜品和食材信息失败:', err);
        wx.showToast({
          title: '处理菜品和食材信息失败',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 更新单个菜品的详细信息
  updateDishDetails: function(dish) {
    this.setData({
      [`dishes[${this.data.dishes.findIndex(d => d._id === dish._id)}]`]: {
        ...dish,
        isOwner: dish.openid === this.data.openid,
        authorId: dish.openid.slice(-4),
        authorAvatarUrl: dish.avatarUrl || '',
      }
    });
  },
    increaseIngredient: function(e) {
      const id = e.currentTarget.dataset.id;
      console.log("增加前的食材数据：", JSON.stringify(this.data.ingredients));
      let ingredients = this.data.ingredients.map(ingredient => {
        if (ingredient.id === id) {
          console.log("找到并增加的食材ID:", id);
          return { ...ingredient, quantity: ingredient.quantity + 1 };
        }
        return ingredient;
      });
      this.setData({ ingredients });
      console.log("增加后的食材数据：", JSON.stringify(this.data.ingredients));
    },
  
    decreaseIngredient: function(e) {
      const id = e.currentTarget.dataset.id;
      let ingredients = this.data.ingredients.map(ingredient => {
        if (ingredient.id === id && ingredient.quantity > 0) {
          return { ...ingredient, quantity: ingredient.quantity - 1 }; // 创建新对象并减少数量
        }
        return ingredient;
      });
      this.setData({ ingredients });
    },

    onUnitChange: function(e) {
      const index = e.currentTarget.dataset.index;
      const unitIndex = e.detail.value;
      const param = {};
      const unitKey = `ingredients[${index}].unitIndex`;
      const unitDisplayKey = `ingredients[${index}].unit`;
      param[unitKey] = unitIndex;
      param[unitDisplayKey] = this.data.units[unitIndex];
      this.setData(param);
      console.log('单位更新:', this.data.ingredients[index]);
    },

    shareToChef: function() {
      wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage']
      });
    },

    onShareAppMessage: function (res) {
      if (res.from === 'button' && res.target && res.target.dataset.type === 'shareToChef') {
          const currentPage = getCurrentPages().pop();
          const shareLink = `/${currentPage.route}?mealId=${this.data.mealId}&isChef=true`;
          return {
              title: '请厨师查看食材清单',
              path: shareLink,
              success: function(res) {
                  wx.showToast({
                      title: '分享成功',
                      icon: 'success',
                      duration: 2000
                  });
              },
              fail: function(res) {
                  wx.showToast({
                      title: '分享失败',
                      icon: 'none',
                      duration: 2000
                  });
              }
          }
      }
      // 默认的分享内容
      return {
          title: '查看食材清单',
          path: `/${getCurrentPages().pop().route}?mealId=${this.data.mealId}`
      }
  },
    navigateToMealDetail: function() {
      wx.navigateTo({
        url: '../mealDetail/index?mealId=' + this.data.mealId + '&mode=view',
        success: function() {
          console.log('跳转成功');
        },
        fail: function() {
          console.error('跳转失败');
        }
      });
    },
    saveIngredients: function() {
        // 调用云函数 cloudSaveIngredients 保存食材数据
        wx.cloud.callFunction({
            name: 'cloudSaveIngredientList',
            data: {
                mealId: this.data.mealId,
                ingredients: this.data.ingredients
            },
            success: res => {
                wx.showToast({
                    title: '食材清单已保存',
                    icon: 'success',
                    duration: 2000
                });
                this.setData({
                  hasSaved: true // 更新标志
                });
            },
            fail: err => {
                wx.showToast({
                    title: '保存失败',
                    icon: 'none',
                    duration: 2000
                });
                console.error('保存食材数据失败', err);
            }
        });
    },
  
    toggleIncludeZeroQuantity: function(e) {
        this.setData({
            includeZeroQuantity: e.detail.value
        });
    },

    viewPurchaseList: function() {
      if (!this.data.hasSaved) {
        wx.showToast({
            title: '请先保存食材清单',
            icon: 'none'
        });
        return;
    }
      wx.cloud.callFunction({
          name: 'cloudGetIngredientList',
          data: { mealId: this.data.mealId },
          success: res => {
              if (res.result && res.result.code === 0) {
                  wx.navigateTo({
                      url: '../purchaseList/index?listId=' + res.result.data._id,
                  });
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
  
  showToast: function(message) {
    wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    });
}
});
