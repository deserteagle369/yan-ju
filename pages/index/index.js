// pages/index/index.js
async function fetchMeals(type) {
  console.log(`启动 fetchMeals 函数，参数为：${type}`);
  try {
    const result = await wx.cloud.callFunction({
      name: 'cloudGetMealsByStatus',
      data: {
        status: type,
      },
    });
    console.log("fetchMeals参数为：",type,"返回结果为：",result);

    if (result.errMsg !== 'cloud.callFunction:ok') {
      console.error('云函数调用失败');
      return [];
    }

    const meals = result.result.data.meals || []; // 确保 meals 是数组
    
    return meals;
  } catch (error) {
    console.error('fetchMeals failed:', error);
    return [];
  }
}
async function fetchTopRatedMeals() {
  console.log("启动 fetchTopRatedMeals 函数");
  try {
    const result = await wx.cloud.callFunction({
      name: 'cloudGetMealsByRate',
      data: {
        sortBy: 'mealRate', // 指定按 mealRate 排序
        sortOrder: 'desc',  // 降序排序
      },
    });
    console.log("fetchTopRatedMeals 返回结果为：", result);


    if (result.errMsg !== 'cloud.callFunction:ok') {
      console.error('云函数调用失败');
      return [];
    }

    const meals = result.result.data.meals || []; // 确保 meals 是数组
    return meals;
  } catch (error) {
    console.error('fetchTopRatedMeals failed:', error);
    return [];
  }
}

Page({
  data: {
    searchKeyword: '',  
    currentMeals: [],
    historyMeals: [],
    errorFetchingMeal: '', // 错误消息
    recommendedMeals: [], // 推荐团餐的数据数组
    currentMealDishes: [], // 假设这是当前团餐的菜品图片数组
    filteredCurrentMeals: [], // 过滤后的当前团餐  
    filteredHistoryMeals: [], // 过滤后的历史团餐列表  
  },
  onLoad: async function(options){
    try {
      console.log("启动 onLoad 函数");
      await this.getMealsByType('ongoing');
      console.log("currentMeals:",this.data.currentMeals);
      await this.getMealsByType('ended');
      console.log("historyMeals:",this.data.historyMeals);      
      await this.getRecommendedMeals();
      console.log("recommendedMeals:",this.data.recommendedMeals);
      this.onInputChange({ detail: { value: '' } });
    } catch (error) {
      console.error('Error loading meals:', error);
      // 可以在这里添加用户错误提示的逻辑
    }
  },
  //获取推荐团餐
  async getRecommendedMeals() {
    const topRatedMeals = await fetchTopRatedMeals();
    if (topRatedMeals.length > 0) {
      this.setData({
        recommendedMeals: topRatedMeals,
      });
      console.log("recommendedMeals:",this.data.recommendedMeals);
    } else {
      console.warn('没有获取到推荐的团餐数据');
      this.setData({
        recommendedMeals: [], // 设置为空数组而不是 undefined
      });
    }
  },
  // 获取正在进行和结束的团餐
// 获取团餐列表
async getMealsByType(type) {
  console.log(`启动 getMealsByType 函数，参数为：${type}`);
  try {
    const mealsData = await fetchMeals(type);
    console.log("mealsData:", mealsData);

    let mealsArray = mealsData; // 直接使用获取的mealsData

    if (mealsData && mealsData.length > 0) {
      // 根据type更新不同的页面数据
      const dataType = type === 'ongoing' ? 'currentMeals' : 'historyMeals';
      this.setData({
        [dataType]: mealsArray,
      });
      // 特殊处理：为 currentMealDishes 赋值
      if (type === 'ongoing') {
        this.fetchDishImages(mealsArray[0]._id); // 假设 mealsArray[0] 是当前团餐
      }
      console.log(`获取${type}的团餐结果：`, this.data);
    } else {
      this.setData({
        errorFetchingMeal: `${type === 'ongoing' ? '当前' : '历史'}团餐未找到，请稍后再试。`,
      });
    }
  } catch (error) {
    console.error(`获取${type}团餐出错:`, error);
    // 设置错误消息
    this.setData({
      errorFetchingMeal: `${type === 'ongoing' ? '当前' : '历史'}团餐获取失败，请稍后再试。`,
    });
  }
},
// 新增函数：根据 mealId 获取菜品图片
// ...

fetchDishImages: function(mealId) {
  const that = this; // 保存对当前页面对象的引用

  // 首先调用 cloudGetMealOrders 云函数获取 dishIds 数组
  wx.cloud.callFunction({
    name: 'cloudGetMealOrders',
    data: { mealId: mealId },
    // 云函数调用成功后的回调
    success: res => {
      if (res.errMsg === 'cloud.callFunction:ok') {
        // 检查返回的数据中是否包含 dishIds 数组
        const dishIds = res.result.data && res.result.data.dishIds || [];
        if (dishIds.length > 0) {
          // 调用 cloudGetDishById 云函数获取所有菜品的详细信息
          wx.cloud.callFunction({
            name: 'cloudGetDishById',
            data: { dishIds: dishIds }, // 传入 dishIds 数组
            // 云函数调用成功后的回调
            success: dishRes => {
              if (dishRes.errMsg === 'cloud.callFunction:ok') {
                // 处理成功获取的菜品数据
                const dishesData = dishRes.result.data;
                console.log("云函数cloudGetDishById返回的结果result.data:", dishesData);
                that.setData({
                  currentMealDishes: dishesData
                });
                console.log("currentMealDishes:", that.data.currentMealDishes);
              } else {
                console.error('cloudGetDishById 云函数调用失败:', dishRes.errMsg);
              }
            },
            fail: err => {
              console.error('cloudGetDishById 调用失败:', err);
            }
          });
        } else {
          console.log('没有找到菜品ID数组或数组为空');
          // 可以更新页面数据，显示没有菜品信息
          that.setData({
            currentMealDishes: []
          });
        }
      } else {
        console.error('cloudGetMealOrders 云函数调用失败:', res.errMsg);
      }
    },
    fail: err => {
      console.error('cloudGetMealOrders 调用失败:', err);
    }
  });
},

// ...
  // Add other methods here
  // 处理搜索框输入变化的事件
  onInputChange: function(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
    });
    // 过滤当前团餐和历史团餐
    this.filterMealsByKeyword(keyword);
  },
  // 根据关键字过滤团餐
  filterMealsByKeyword(keyword) {
    // 修正变量引用
    let filteredCurrentMeals = this.data.currentMeals;
    let filteredHistoryMeals = this.data.historyMeals;
  
    if (keyword === '') {
      // 显示所有团餐
    } else {
      filteredCurrentMeals = this.data.currentMeals.filter(this.createMealFilter(keyword));
      filteredHistoryMeals = this.data.historyMeals.filter(this.createMealFilter(keyword));
    }
  
    this.setData({
      filteredCurrentMeals,
      filteredHistoryMeals,
    });
  },
  // 创建过滤函数
  createMealFilter: function(keyword) {
    return (meal) => {
      return meal.mealName.toLowerCase().includes(keyword.toLowerCase());
    };
},
  goToMealDetail: function(e) {
    const mealId = e.currentTarget.dataset.mealid;  // 获取团餐 ID
    console.log("goToMealDetail函数收到团餐Id:", mealId);
    if (mealId) {
         wx.navigateTo({
           url: '/pages/MealDetail/index?mealId=' + mealId,
          success: function(res) {
            console.log('跳转成功');
            },
          fail: function(res) {
            console.log('跳转失败', res);
          }
        });
    } else {
         console.error('mealId not found or is empty');
    }
  },
  // 点击推荐团餐时触发
  onTapRecommendedMeal: function(e) {
    console.log("触发了onTapRecommendedMeal")
    const mealId = e.currentTarget.dataset.mealid; // 从事件对象中获取绑定的团餐 ID
    this.goToMealDetail(mealId);
  },
  createMeal: function() {
    const { mealName, date, deadline } = this.data;
    // Call cloud function to create meal
    // Navigate to MealDetail page on success
    wx.navigateTo({
      url: '/pages/createMeal/index',
    })
  },
  //分享当前页面
  onShareAppMessage: function() {
    return {
      title: '团餐助手',
      path: '/pages/index/index',
      imageUrl: '/assets/yan-ju-meal.jpg'
    }
  },  
});
