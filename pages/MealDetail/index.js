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
    categories: [], // 菜品库类别
    filteredDishes: [], // 根据类别筛选出的菜品库
    selectedCategory: null, // 当前选中的类别
    currentFilter: 'search', // 初始筛选模式为“搜索菜品”
    selectedDish: null,
    dishQuantity: 1,
    user: null,
    participantOrders: [],
    mealOrder: {  
      dishOrders: [], // 初始时菜品订单为空数组 
    }
  },
  
  methods: {
  switchFilter(e) {
    this.setData({
      currentFilter: e.currentTarget.dataset.filter,
    });
    },
  },

  onLoad: function (options) {
    // 初始化 participantOrder 为一个对象，其中 orders 为数组
    this.setData({
      participantOrder: {
        orders: []
      }
    });
    const app = getApp();
    let openid = app.globalData.openid;
    console.log("onLoad函数中从缓存中获取的openid：",openid);
    // 假设从页面参数中获取团餐 ID
    let mealId = options.mealId || wx.getStorageSync('mealId') || '';
    console.log("MealDetail页面收到的mealId:",mealId);
    const userInfo = app.globalData.userInfo;

    if (userInfo) {
      // 如果全局状态中已经有用户信息，则直接设置到页面数据
      this.setData({
        user: userInfo
      });
    } else {
      // 用户信息未获取，调用云函数进行获取
      wx.cloud.callFunction({
        name: 'cloudGetUserProfile',
        data: {
          openid: openid // 确保这里使用的是正确的 openid
        },
        success: (res) => {
          if (res.result.success) {
            // 成功获取用户信息，更新全局状态和页面数据
            const userInfo = res.result.data;
            app.globalData.userInfo = userInfo; // 更新全局状态
            this.setData({
              user: userInfo // 更新页面数据
            });
          } else {
            // 处理错误情况
            console.error('获取用户信息失败：', res.result.error);
            // 这里可以添加一个提示给用户
          }
        },
        fail: (err) => {
          // 处理调用云函数失败的情况
          console.error('调用云函数失败：', err);
          // 这里也可以添加一个提示给用户
        }
      });
    }

    console.log("user: ",this.data.user);
    this.setData({
      mealId: mealId
    });
    // 使用云函数获取团餐详情
    this.getMealDetails(mealId);
  },
  increaseQuantity: function(e) {  
    let dishes = this.data.dishes;   
    let currentDishIndex = e.currentTarget.dataset.index;
    const mealId = this.data.mealId;
    const openid = this.data.user.openid;
    const dishId = dishes[currentDishIndex]._id;
    const dishQuantity = dishes[currentDishIndex].dishQuantity;
    console.log("increaseQuantity for dishes: ",dishes,"currentDishIndex:",currentDishIndex,"dishId:",dishId,"dishQuantity:",dishQuantity);
    if (currentDishIndex >= 0 && currentDishIndex < dishes.length) {
      const originalDishQuantity = dishes[currentDishIndex].dishQuantity;  
      dishes[currentDishIndex].dishQuantity++; 
      console.log("new dishQuantity:",dishes[currentDishIndex].dishQuantity);
      this.setData({  
        dishes: dishes  
      });  
    };
    console.log("准备调用updateDishQuantity函数，参数为：","mealId:",mealId,"dishId:",dishId,"dishQuantity:",dishQuantity,"openid:",openid);
    const newDishQuantity = dishes[currentDishIndex] ? dishes[currentDishIndex].dishQuantity : null; // 如果菜品存在，获取更新后的数量；否则传递 null
    this.updateDishQuantity(mealId,openid,dishId,newDishQuantity);
  },
  decreaseQuantity: function(e) {    
    let dishes = this.data.dishes;    
    let currentDishIndex = e.currentTarget.dataset.index;  
    const mealId = this.data.mealId;
    const openid = this.data.user.openid;
    const dishId = dishes[currentDishIndex]._id;
    const dishQuantity = dishes[currentDishIndex].dishQuantity;
    console.log("decreaseQuantity for dishes: ",dishes,"currentDishIndex:",currentDishIndex,"dishId:",dishId,"dishQuantity:",dishQuantity,"openid:",openid);
    if (currentDishIndex >= 0 && currentDishIndex < dishes.length) {    
      const originalDishQuantity = dishes[currentDishIndex].dishQuantity;  
      if (originalDishQuantity > 0) {    
        dishes[currentDishIndex].dishQuantity -= 1;    
        if (dishes[currentDishIndex].dishQuantity === 0) {  
          // 数量已减到0，删除菜品  
          dishes.splice(currentDishIndex, 1);  
        }  
      };
      // console.log("new dishQuantity:",dishes[currentDishIndex].dishQuantity);  
      // 统一更新数据，无论是否删除了菜品  
      this.setData({    
        dishes: dishes,    
      });    
    }
    console.log("准备调用updateDishQuantity函数，参数为：","mealId:",mealId,"dishId:","openid:",openid,"dishId:",dishId,"dishQuantity:",dishQuantity);
    const newDishQuantity = dishes[currentDishIndex] ? dishes[currentDishIndex].dishQuantity : 0; // 如果菜品存在，获取更新后的数量；否则传递 null
    this.updateDishQuantity(mealId,openid,dishId,newDishQuantity)   
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
    })  
  }, 
  getMealDetails: function(mealId) {  
    console.log("调用函数getMealDetails，参数为：", mealId);  
    wx.cloud.callFunction({  
      name: 'cloudGetMealsById',  
      data: {  
        mealId: mealId  
      },  
      success: res => {  
        // res.result 包含云函数返回的result对象  
        const { code, message, data } = res.result;
        if (code === 0) {  
          // 处理成功的情况，比如更新页面数据  
          this.setData({  
            mealDetail: data.mealDetail,  
            dishCount: data.dishCount,  
            participantCount: data.participantCount,  
            // 如果需要菜品详细信息，也在这里设置  
            dishes: data.dishes  
          });  
        console.log("云函数返回的data:",data);
        console.log("云函数返回的dishes:",data.dishes);
        } else {  
          // 处理错误的情况，比如显示错误信息  
          wx.showToast({  
            title: message,  
            icon: 'none'  
          });  
        }  
      },  
      fail: (err) => {  
        console.error('getMealDetails调用云函数失败', err);  
        // 错误处理  
        wx.showToast({  
          title: '服务器异常，请稍后再试',  
          icon: 'none',  
          duration: 2000  
        });  
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
        name: 'getDishes',
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
  selectCategory: function(e) {
    const categoryId = e.currentTarget.dataset.categoryId;
    this.filterDishesByCategory(categoryId);
  },
  filterDishesByCategory: function(categoryId) {
    // 根据categoryId筛选菜品库，并更新filteredDishes
    // 示例代码省略，具体取决于你的数据处理逻辑
  },
  clickAddBtn: function(e) {
    var dishId = e.currentTarget.dataset.dishId;
    var quantityToAdd = 1;
    this.addToMeal(dishId, quantityToAdd);
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
    const updatedDishes = dishes.map(dish => {  
    if (dish.dishId === dishId) {  
      dishFound = true;  
      // 如果找到了匹配的菜品，增加数量  
      const updatedDish = { ...dish,dishQuantity: dish.dishQuantity + quantityToAdd };
      console.log("updatedDishes", updatedDishes);
      return updatedDish;  
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


  redirectToDishSummit: function() {
    wx.navigateTo({
      url: '/pages/DishSummit/index',
    })
  },
});