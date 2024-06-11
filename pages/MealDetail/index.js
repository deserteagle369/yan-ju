//当前页面设置分享信息

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
    DishCategory: null, // 当前选中的类别
    currentFilter: 'search', // 初始筛选模式为“搜索菜品”
    selectedDish: null,
    dishQuantity: 1,
    user: null,
    participantOrders: [],
    mealOrder: {  
      dishOrders: [], // 初始时菜品订单为空数组 
    },
    currentMealDishes: [], // 当前团餐下的菜品
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
      },
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
    console.log("increaseQuantity被调用，参数为：",e.currentTarget.dataset);
    console.log("this.data:",this.data);
    let dishes = this.data.dishes;   
    const mealId = this.data.mealId;
    const openid = this.data.user.openid;
    const dishId = e.currentTarget.dataset.dishId;
    const dishQuantity = e.currentTarget.dataset.dishQuantity;
    let dishToUpdate = dishes.find(dish => dish._id === dishId);  
    if (dishToUpdate) {  
      // 菜品存在，增加数量  
      dishToUpdate.dishQuantity++;  
      this.setData({  
        dishes: dishes // 注意：这里直接设置dishes可能不会触发视图更新，因为数组引用没有变  
      });  
      this.updateDishQuantity(mealId, openid, dishId, dishToUpdate.dishQuantity); 
    } else {  
      // 菜品不存在，添加到数组中
      let dishToUpdate = this.data.searchedDishes.find(dish => dish._id === dishId);  
      dishes.push({  
        _id: dishId,  
        dishImageUrl: dishToUpdate.dishImageUrl,  
        dishName: dishToUpdate.dishName,  
        dishQuantity: 1,
        DishCategory: dishToUpdate.DishCategory,
        seleectedSpicyLevel: dishToUpdate.seleectedSpicyLevel,
        time: dishToUpdate.time,
      });
      this.addToMeal(dishId, 1);  
    }
    this.setData({  
        dishes: [...dishes]  
    });
    // 调用后端更新数量的函数
  },
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
    } 
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
            dishes: data.dishes,
            currentMealDishes: data.dishes.map(dish => dish._id),  
          });  
        console.log("云函数cloudGetMealsById返回的data:",data);
        console.log("云函数cloudGetMealsById返回的dishes:",data.dishes);
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


  redirectToDishSummit: function() {
    wx.navigateTo({
      url: '/pages/DishSummit/index',
    })
  },

 isValidMealId:function(mealId) {
  // 这里可以添加更复杂的规则，例如检查mealId是否符合特定的格式
  // 例如：检查mealId是否只包含字母、数字、横杠和下划线
  return /^[a-zA-Z0-9\-_]+$/.test(mealId);
},

// 假设存在一个用于检查dishes数组和dishImageUrl有效性的函数  
getFirstValidImageUrl: async function(dishes) {  
  try {  
    // 假设 getSignedImageUrl 返回一个 Promise  
    const signedUrl = await getSignedImageUrl(dishes[0].dishImageUrl);  
    // 检查数组长度和URL是否有效  
    if (dishes.length > 0 && isValidUrl(signedUrl)) {  
      return signedUrl;  
    }  
  } catch (error) {  
    // 在这里处理可能的错误，比如网络错误或 getSignedImageUrl 抛出的异常  
    console.error('Error fetching signed image URL:', error);  
  }  
  // 返回一个默认的图片URL  
  return 'https://example.com/default-image.jpg';  
},

async shareImage() {
  const signedUrl = await getSignedImageUrl(this.data.dishImageUrl);
  // 使用signedUrl进行分享或其他操作
},
onShareAppMessage: function() {
  // 检查mealId的合法性
  if (!isValidMealId(this.data.mealId)) {
    console.error('Invalid mealId');
    return;
  }

  // 安全地构建分享的标题和描述
  const safeNickName = escapeHtml(nickName);
  const safeMealName = escapeHtml(mealName);

  return {
    title: `来看看${safeNickName}分享的美食吧！`,
    path: `/pages/MealDetail/index?mealId=${encodeURIComponent(this.data.mealId)}`,
    desc: `${safeMealName}`,
    imageUrl: getFirstValidImageUrl(dishes),
    success: function(res) {
      console.log('分享成功');
      // 可以在这里增加进一步的用户反馈或操作
    },
    fail: function(res) {
      console.log('分享失败');
      // 可以在这里增加进一步的错误处理或用户反馈
    }
  }
}
});