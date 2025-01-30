//pages/mealDetail/index.js
const base = require('../../utils/language.js')
const _ = base._
Page({
  data: {
    mealDetail: {},
    openid: '',
    mealId: '',
    mealName: '',
    mealDate: '',
    mealDeadline: '',
    dishes: [],
    totalDishes: 0,
    searchKeyword: '', // 添加一个用于存储搜索框输入内容的变量
    isSearchFocused: false, // 可选，用于控制输入框焦点状态
    searchedDishes: [], // 搜索结果显示的菜品
    showSearchResult: false, // 是否显示搜索结果
    hasSearchResult: false, // 是否有搜索结果
    categories: ['肉类', '禽类', '海鲜类', '蔬菜类', '水果类', '甜品类','饮料类'],  // 初始化分类
    allDishes: [],
    filteredDishes: [], // 根据类别筛选出的菜品库
    selectedCategory: '肉类', // 默认分类
    currentFilter: 'search', // 初始筛选模式为“搜索菜品”
    selectedDish: null,
    dishQuantity: 1,
    userInfo: null,
    mealOrder: {  
      dishOrders: [], // 初始时菜品订单为空数组 
    },
    currentMealDishes: [], // 当前团餐下的菜品
    canJoin: false,
    isParticipant: false,
    _t: '',
  },
  
  switchFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    // 可以在这里添加其他逻辑，比如加载数据等
  },
  onLoad: function(options) {
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('团餐详情')
    });
    const app = getApp();
    const { mealId, mode = 'view' } = options;
    this.setData({ mealId: mealId || '', canJoin: mode === 'join' });
    console.log("mealDetail页面被打开,参数为:", mealId, mode);
  
    let userInfo = app.globalData.userInfo || wx.getStorageSync('user');
    if (!userInfo) {
      app.getOpenid().then(() => {
        userInfo = app.globalData.userInfo;
        if (!userInfo) {
          wx.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000,
            complete: () => {
              wx.redirectTo({ url: '/pages/UserProfile/index' });
            }
          });
        } else {
          this.initializePage(userInfo, mealId);
        }
      });
    } else {
      this.initializePage(userInfo, mealId);
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
  
  initializePage: function(userInfo, mealId) {
    const app = getApp();  // 确保在函数内部获取app实例
    this.setData({
      user: userInfo,
      openid: userInfo.openid,
    });
    console.log("current user openid:", this.data.openid);
    app.globalData.userInfo = userInfo; // 同步到全局变量
    this.getMealDetails(mealId).then(() => {
      this.checkParticipation(app);  // 检查用户是否参与，移到获取详情后执行
      if (this.data.canJoin && (this.data.isParticipant || this.data.mealDetail._openid === userInfo.openid)) {
        this.setData({ canInvite: true });
      }
      if (this.data.categories.length > 0) {
        this.selectCategory({currentTarget: {dataset: {categoryName: this.data.categories[0]}}});
      }
    }).catch(error => {
      console.error('加载团餐详情失败:', error);
    });
  },
  
  checkParticipation: function() {  // 接收app参数
    const app = getApp();
    const userOpenId = app.globalData.openid; // 使用传入的app实例获取当前用户的openid
    if (this.data.mealDetail && this.data.mealDetail.participants) {
      const isParticipant = this.data.mealDetail.participants.includes(userOpenId);
      console.log('participants:',this.data.mealDetail.participants);
      console.log('isParticipant:',isParticipant);
      console.log('userOpenId:',userOpenId);
      console.log('mealDetail._openid:',this.data.mealDetail._openid);
      this.setData({
        isParticipant: isParticipant,
        canInvite: isParticipant || this.data.mealDetail._openid === userOpenId  // 可以邀请的条件
      });
      wx.setStorageSync('isParticipant', isParticipant);
      console.log("用户参与状态: ", isParticipant ? "已参与" : "未参与");
      console.log("用户邀请状态: ", this.data.canInvite ? "可以邀请" : "不可以邀请");
    }
  },
  

  increaseQuantity: function(e) {  
    if (!this.data.user) {
      console.error('用户信息未定义，无法增加数量');
      wx.showToast({
          title: '未获取到用户信息，请重新登录',
          icon: 'none',
          duration: 2000
      });
      return;
    }

    const dishId = e.currentTarget.dataset.dishId;
    let dishToUpdate = this.findDishInMealById(dishId);

    if (dishToUpdate) {
      dishToUpdate.dishQuantity++;
    } else {
      dishToUpdate = this.findDishById(dishId);
      if (dishToUpdate) {
        dishToUpdate = {...dishToUpdate, dishQuantity: 1};  // 初始化新菜品的数量
        this.data.dishes.push(dishToUpdate);
      } else {
        console.error('菜品不存在，无法添加', dishId);
        return;
      }
    }

    this.setData({ dishes: [...this.data.dishes] });
    this.updateDishQuantity(this.data.mealId, this.data.user.openid, dishId, dishToUpdate.dishQuantity);
  },

  findDishInMealById: function(dishId) {
      return this.data.dishes.find(d => d._id === dishId);
  },

  findDishById: function(dishId) {
      return this.data.searchedDishes.find(d => d._id === dishId) || this.data.filteredDishes.find(d => d._id === dishId);
  },

  
  // 减少数量的方法
  decreaseQuantity: function(e) {
    const dishId = e.currentTarget.dataset.dishId;
    if (!this.data.user) {
      console.error('用户信息未定义，无法减少数量');
      wx.showToast({
        title: '未获取到用户信息，请重新登录',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    let dish = this.findDishById(dishId);
    if (dish && dish.dishQuantity > 0) {
      dish.dishQuantity -= 1;
      this.setData({
        dishes: this.updateDishesArray(this.data.dishes, dish)
      });
      this.updateDishQuantity(this.data.mealId, this.data.user.openid, dishId, dish.dishQuantity);
    } else {
      console.error('未找到菜品 ID:', dishId);
    }
  },
  
  // 查找菜品，考虑到多个来源和空数据的情况
// findDishById: function(dishId) {
//   let dish = null;
//   // 检查搜索结果数组是否存在且不为空
//   if (this.data.searchedDishes && this.data.searchedDishes.length > 0) {
//     dish = this.data.searchedDishes.find(d => d._id === dishId);
//   }
//   // 如果在搜索结果中没有找到且分类筛选结果存在且不为空
//   if (!dish && this.data.filteredDishes && this.data.filteredDishes.length > 0) {
//     dish = this.data.filteredDishes.find(d => d._id === dishId);
//   }
//   return dish;
// },

  // 更新菜品数组，确保视图更新
  updateDishesArray: function(dishes, updatedDish) {
    return dishes.map(dish => dish._id === updatedDish._id ? {...dish, dishQuantity: updatedDish.dishQuantity} : dish);
  },
  
  // 查找菜品，考虑到多个来源
 
  decreaseQuantity: function(e) {    
    let dishes = this.data.dishes;    
    const mealId = this.data.mealId;
    const openid = this.data.user.openid;
    const dishId = e.currentTarget.dataset.dishId;
    const dishQuantity = e.currentTarget.dataset.dishQuantity;
    let dishToUpdate = dishes.find(dish => dish._id === dishId);  
    console.log("decreaseQuantity for dishes: ",dishes,"dishId:",dishId,"dishQuantity:",dishQuantity,"openid:",openid);
    if (dishToUpdate) {  
      // 菜品存在，减少数量  
      if (dishToUpdate.dishQuantity < 2) { 
        // 数量为1，从数组中移除
         dishes = dishes.filter(dish => dish._id !== dishId);    
      }
      dishToUpdate.dishQuantity--; 
      this.setData({  
          dishes: dishes // 注意：这里直接设置dishes可能不会触发视图更新，因为数组引用没有变  
      });  
      console.log("dishes:", dishes);
      // 为了确保视图更新，您可能需要使用扩展运算符或concat等方法来创建一个新数组  
      this.setData({  
          dishes: [...dishes] // 或者使用其他方法来创建一个新的数组副本  
      });  
      console.log("dishes:", dishes);
      // 调用后端更新数量的函数  
      this.updateDishQuantity(mealId, openid, dishId, dishToUpdate.dishQuantity);  
    } else {  
      // 菜品不存在，处理错误情况（可选）  
      console.error('Dish not found with ID:', dishId);  
    } ;
  },
  updateDishQuantity: function(mealId,openid, dishId, dishQuantity) {
    console.log('启动函数updateDishQuantity，参数为：', "mealId:", mealId, "openid:",openid,"dishId:", dishId, "dishQuantity:", dishQuantity);
    wx.cloud.callFunction({  
      name: 'cloudUpdateDishQuantity', // 云函数名称  
      data: {  
        mealId,  
        openid,
        dishId,  
        dishQuantity  
      },  
      success: res => {  
        console.log('updateDishQuantity 更新菜品数量成功', res.result)  
        // 更新成功后的逻辑，如刷新页面等  
      },  
      fail: err => {  
        console.error('updateDishQuantity 更新菜品数量失败', err)  
        // 更新失败后的逻辑，如显示错误信息等  
      }  
    })  ;
  }, 
  
  getMealDetails: async function(mealId) {
    console.log("调用函数getmealDetails，参数为：", mealId);
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
        console.log('MealDetail页面获取到的 mealDetail:', this.data.mealDetail);
        
        // 处理所有菜品的食材
        // await this.processDishesAndIngredients(data.dishes);
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

  endMeal: function() {
    const that = this;
    wx.showModal({
      title: '确认截止点菜',
      content: '确定要结束点菜并提交订单吗？此操作不可逆。',
      success (res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'updateMealStatus',
            data: {
              mealId: that.data.mealId,
              status: 'ended'
            },
            success: function(res) {
              if(res.result.success) {
                wx.showToast({
                  title: '团餐已截止',
                  icon: 'success',
                  duration: 2000
                });
                that.setData({
                  'mealDetail.status': 'ended'
                });
                // 如果团餐截止成功，更新积分
                that.updateUserPoints(that.data.openid, 1);  // 每次参与团餐加1分
              } else {
                wx.showToast({
                  title: '操作失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            },
            fail: function(err) {
              console.error('调用云函数失败：', err);
              wx.showToast({
                title: '网络错误',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      }
    });
  },
  
  updateUserPoints: function(openid, increment) {
    wx.cloud.callFunction({
      name: 'cloudUpdateUserPoints',
      data: {
        openid: openid,
        increment: increment
      },
      success: res => {
        if (res.result.success) {
          console.log('积分更新成功');
        } else {
          console.error('积分更新失败:', res.result.error);
        }
      },
      fail: err => {
        console.error('调用云函数失败:', err);
      }
    });
  },
  
  
  handleSearch(e) {
    let searchKeyword = '';
  
    if (e.type === 'input') {
      searchKeyword = e.detail.value.trim();
    } else if (e.type === 'tap') {
      searchKeyword = this.data.searchKeyword.trim();
    }
  
    console.log('Search keyword:', searchKeyword);
  
    if (searchKeyword) {
      this.setData({
        showSearchResult: true,
      });
      this.searchDishes(searchKeyword);
    } else {
      this.setData({
        showSearchResult: false,
        searchedDishes: [],
        hasSearchResult: false,
      });
    }
  },
  
  async searchDishes(searchKeyword) {
    console.log("searchDishes关键字:",searchKeyword)
    try {
      const result = await wx.cloud.callFunction({
        name: 'cloudGetDishesByName',
        data: {
          keyword: searchKeyword,
        },
      });
      console.log("收到云端返回结果：",result.result)
      const searchedDishes = result.result || [];
      const hasSearchResult = searchedDishes.length > 0;
      console.log("搜索返回结果searchedDishes:",searchedDishes)
      this.setData({
        searchedDishes,
        hasSearchResult,
      });
    } catch (e) {
      console.error('搜索菜品失败:', e);
      wx.showToast({
        title: '搜索失败，请稍后再试',
        icon: 'none',
        duration: 1500,
      });
    }
  },
  isDishInMeal: function(dishId) {
    console.log('Current Meal Dishes:', this.data.currentMealDishes);
    return this.data.currentMealDishes.includes(dishId);
  },
  selectCategory: function(e) {
    const categoryName = e.currentTarget.dataset.categoryName;
    console.log('selectCategory triggered:', categoryName);
    this.setData({
      selectedCategory: categoryName  // 更新当前选中的分类
    });
    this.filterDishesByCategory(categoryName);  // 根据分类名称筛选菜品
  },
  filterDishesByCategory: function(category) {
    console.log('filterDishesByCategory triggered:', category);
    wx.cloud.callFunction({
      name: 'cloudGetDishesByCategory',
      data: {
        category: category
      },
      success: res => {
        if (res.result.code === 0) {
          console.log('收到云函数cloudGetDishesByCategory返回菜品:', res.result.data);
          this.setData({
            filteredDishes: res.result.data
          });
        } else {
          console.error('获取菜品失败:', res.result.message);
        }
      },
      fail: error => {
        console.error('云函数调用失败:', error);
      }
    });
  },


  clickAddBtn: function(e) {
    var dishId = e.currentTarget.dataset.dishId;
    var quantityToAdd = 1;
    this.addToMeal(dishId);
  },  

  addToMeal: function(dishId, quantityToAdd) {
    console.log('addToMeal triggered:',this.data);
    const openid = getApp().globalData.openid; // 确保使用当前用户的 openid
    console.log("getApp获取到的openid:", openid);
    const mealId = this.data.mealId;
    const dishes = this.data.dishes; 
    let dishFound = false;

    // 从页面数据中获取用户信息
    const user = this.data.user;
    if (!user) {
      console.error('用户信息未定义');
      return;
    }
  
    // 查找匹配的菜品并更新数量  
    const updatedDishes = this.data.dishes.map(dish => {  
    if (dish.dishId === dishId) {  
      dishFound = true;  
      // 如果找到了匹配的菜品，增加数量  
      const updatedDish = { ...dish,dishQuantity: dish.dishQuantity + quantityToAdd };
      console.log("updatedDishes", updatedDishes);
      return {...dish, dishQuantity: dish.dishQuantity + 1};  
    }
    return dish;
    });  
  
  // 如果没有找到匹配的菜品，则在数组末尾添加新菜品  
  if (!dishFound) {   
    console.log("没有找到匹配菜品，添加新菜品：", dishId, quantityToAdd);
    const newDish = { dishId: dishId, dishQuantity: quantityToAdd };
    updatedDishes.push(newDish);  
  }  

  console.log("添加后的dishes:", updatedDishes);
    // 无论是否找到匹配的菜品，都更新页面的数据  
    this.setData({    
      dishes: updatedDishes    
  });

    // 在小程序端调用云函数addToMeal
    console.log("调用云函数cloudAddToMealCloud，参数为：", "mealId:", this.data.mealId, "openid:", openid, "dishId:", dishId,"dishQuantity:",quantityToAdd);
    wx.cloud.callFunction({
      name: 'cloudAddToMeal',
      data: {
          mealId: mealId, // 团餐ID
          openid: openid, // 用户openid
          dishId: dishId, // 菜品ID
          // action: currentDishIndex !== -1 ? 'update' : 'add' // 区分是增加已有菜品数量还是添加新菜品
          dishQuantity: quantityToAdd, // 菜品数量
        } 
    }).then(res => {
      console.log("云函数cloudAddToMealCloud执行成功", res);
      console.log("云函数cloudAddToMealCloud执行成功", this.data);
      if (res.result.success) {
        
        // 更新成功后的逻辑，如刷新页面等
        wx.showToast({
          title: '添加菜品成功',
          icon: 'success',
          duration: 2000,
        });
       } else {
        // 更新失败后的逻辑，如显示错误信息等
        wx.showToast({
          title: res.result.message || '添加菜品失败',
          icon: 'error',
          duration: 2000,
        });
       }
    }).catch(err => {
      console.error('云函数cloudAddToMealCloud执行失败', err);
      wx.showToast({
        title: err.errMsg || '添加菜品失败',
        icon: 'error',
        duration: 2000,
      });
     });
  },
  onDishSelected: function(e) {  
    console.log("点击了菜品:",e)
    const dishId = e.currentTarget.dataset.dishId;
    console.log("点击了DishId: " + dishId)
    // 显示菜品详情或其他操作
    if (dishId) {
      wx.navigateTo({
        url: '/pages/dishDetail/index?dishId=' + dishId,
       success: function(res) {
         console.log('跳转到菜品详情页成功');
         },
       fail: function(res) {
         console.log('跳转到菜品详情页失败', res);
       }
     });
    } else {
      console.error('dishId not found or is empty');
    }  
  },
  redirectToDishSummit: function() {
    wx.navigateTo({
      url: '/pages/dishSummit/index',
    })
  },

  // 导航到食材清单页面
  navigateToIngredients: function() {
    console.log("启动navigateToIngredients函数,参数为:",this.data.mealId);

    wx.navigateTo({
      url: '/pages/ingredients/index?mealId=' + this.data.mealId,  // 假设食材清单页面的路径是这样的
      success: function(res) {
        console.log('跳转到食材清单页面成功');
      },
      fail: function(res) {
        console.log('跳转到食材清单页面失败', res);
      }
    });
  },

  onShareView: function() {
    console.log("分享查看被点击");
    this.onShareAppMessage();
  },

  onInviteJoin: function() {
    console.log("邀请加菜被点击");
    // 可以增加逻辑来处理邀请逻辑，例如分享带参数的链接
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {
        this.onShareAppMessage({
          title: `邀请您加入团餐：${this.data.mealDetail.mealName}`,
          path: `/pages/mealDetail/index?mealId=${this.data.mealId}&mode=join`
        });
      }
    });
  },

  
  onShareAppMessage: function() {
    const firstDishImage = this.data.dishes.length > 0 ? this.data.dishes[0].dishImageUrl : '/assets/images/share-meal.jpg';
    return {
      title: `来看看${this.data.user.nickName}分享的美食吧！`,
      path: `/pages/mealDetail/index?mealId=${encodeURIComponent(this.data.mealId)}`,
      desc: `${this.data.mealName}`,
      imageUrl: firstDishImage,
      success: function(res) {
        console.log('分享成功');
        // 可以在这里增加进一步的用户反馈或操作
      },
      fail: function(res) {
        console.log('分享失败');
        // 可以在这里增加进一步的错误处理或用户反馈
      }
    }
  },
  goBack: function() {
    wx.navigateBack({
      delta: 1 // 返回的页面数，如果 delta 大于现有页面数，则返回到首页
    });
  }
});