// pages/index/index.js
async function fetchMeals(type) {
  console.log(`启动 fetchMeals 函数，参数为：${type}`);
  try {
    const result = await wx.cloud.callFunction({
      name: 'getMealsByStatus',
      data: {
        status: type,
      },
    });
    console.log(`fetchMeals 返回结果为：${JSON.stringify(result)}`);

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
      name: 'getMealsByRate',
      data: {
        sortBy: 'mealRate', // 指定按 mealRate 排序
        sortOrder: 'desc',  // 降序排序
      },
    });
    console.log(`fetchTopRatedMeals 返回结果为：${JSON.stringify(result)}`);

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
    currentMeal: null,
    historyMeals: [],
    recommendedMeals: [], // 推荐团餐的数据数组
    currentMealDishes: [], // 假设这是当前团餐的菜品图片数组
  },
  onLoad: async function(options){
    try {
      await this.getCurrentMeal('ongoing');
      await this.getHistoryMeals('ended');
      await this.getRecommendedMeals();
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
  // 获取正在进行的团餐
  async getCurrentMeal(type) {
    console.log(`启动 getCurrentMeal 函数，参数为：${type}`);
    try {
      const mealsData = await fetchMeals(type);
      console.log("mealsData:", mealsData);

      if (mealsData && mealsData.length > 0) {
        // 使用 this.setData() 来更新页面上的数据
        this.setData({
          currentMeal: mealsData[0]
        });
        console.log('当前进行中的团餐:', this.data.currentMeal);
      } else {
        console.log('没有找到进行中的团餐');
        // 同样使用 this.setData() 来更新页面上的数据
        this.setData({
          currentMeal: null
        });
      }
    } catch (error) {
      console.error('获取当前团餐出错:', error);
      // 处理错误，例如设置一个错误消息到页面上
      this.setData({
        errorFetchingMeal: '无法获取当前团餐，请稍后再试。'
      });
    }
  },
  // ...其他相关函数也添加相应的打印语句
  // 获取历史团餐
  async getHistoryMeals(typeParam) {
    try {
      const meals = await fetchMeals(typeParam);
      if (meals && Array.isArray(meals) && meals.length > 0) {
        this.setData({
          historyMeals: meals,
        });
      } else {
        console.log('No history meals found');
        this.setData({ historyMeals: [] });
      }
    } catch (error) {
      console.error('Error fetching history meals:', error);
      // 可以在这里添加用户错误提示的逻辑
    }
  },
  
  // Add other methods here
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
});
