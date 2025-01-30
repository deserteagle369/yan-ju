// pages/index/index.js
const base = require('../../utils/language.js')
const _ = base._
async function fetchMeals(type,openid) {
  console.log(`启动 fetchMeals 函数，参数为：${type}, openid 为：${openid}`);
  try {
    const result = await wx.cloud.callFunction({
      name: 'cloudGetMealsByStatus',
      data: {
        status: type,
        openid: openid, // 按 openid 排序
      },
    });
    console.log("fetchMeals参数为：",type,openid,"返回结果为：",result);

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
    errorFetchingMeal: '',
    recommendedMeals: [],
    swipeMealDishes: [],
    filteredCurrentMeals: [],
    filteredHistoryMeals: [],
    recommendMealDishes: [],
    currentIndex: 0, // 初始化当前轮播索引
    _t: '',
  },

  onLoad: async function(options){
    this.mixinFn();
    const app = getApp();
    const openid = app.globalData.openid || wx.getStorageSync('user').openid;
    console.log("当前用户的 openid:", openid); // Debug 输出以确认获取到的 openid
    try {
      console.log("启动 onLoad 函数");
      await this.getMealsByType('ongoing',openid);
      console.log("currentMeals:",this.data.currentMeals);
      await this.getMealsByType('ended',openid);
      console.log("historyMeals:",this.data.historyMeals);      
      await this.getRecommendedMeals();
      console.log("recommendedMeals:",this.data.recommendedMeals);
      this.onInputChange({ detail: { value: '' } });
    } catch (error) {
      console.error('Error loading meals:', error);
      // 可以在这里添加用户错误提示的逻辑
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

  updatePageData: function() {
    this.setData({
      pageTitle: i18n.t('page_title'), // 页面标题
      welcomeText: i18n.t('welcome_text') // 欢迎文本
    });
  },
  // 获取推荐团餐
async getRecommendedMeals() {
  const topRatedMeals = await fetchTopRatedMeals();
  if (topRatedMeals.length > 0) {
    this.setData({
      recommendedMeals: topRatedMeals,
      recommendMealDishes: [] // 重置轮播图数组
    });
    // 为每个推荐团餐获取第一张菜品图片
    topRatedMeals.forEach(meal => {
      this.fetchDishImages(meal._id);
    });
  } else {
    console.warn('没有获取到推荐的团餐数据');
    this.setData({
      recommendedMeals: [], // 设置为空数组而不是 undefined
      swipeMealDishes: [] // 确保没有菜品数据时清空菜品数组
    });
  }
},

  // 获取正在进行和结束的团餐
// 获取团餐列表
async getMealsByType(type,openid) {
  console.log(`启动 getMealsByType 函数，参数为：${type}, openid：${openid}`);
  try {
    const mealsData = await fetchMeals(type,openid);
    console.log("mealsData:", mealsData);

    let mealsArray = mealsData; // 直接使用获取的mealsData

    if (mealsData && mealsData.length > 0) {
      // 根据type更新不同的页面数据
      const dataType = type === 'ongoing' ? 'currentMeals' : 'historyMeals';
      this.setData({
        [dataType]: mealsArray,
      });
      // 特殊处理：为 swipeMealDishes 赋值
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

// 获取团餐菜品图片
fetchDishImages: function(mealId) {
  const that = this;
  wx.cloud.callFunction({
    name: 'cloudGetMealOrders',
    data: { mealId: mealId },
    success: res => {
      if (res.errMsg === 'cloud.callFunction:ok' && res.result.data && res.result.data.dishIds.length > 0) {
        // 获取所有的菜品信息
        wx.cloud.callFunction({
          name: 'cloudGetDishById',
          data: { dishIds: res.result.data.dishIds },
          success: dishRes => {
            if (dishRes.errMsg === 'cloud.callFunction:ok' && dishRes.result.data.length > 0) {
              // 取第一个菜品的信息用于轮播图
              const dishData = dishRes.result.data[0]; // 只取第一个菜品数据
              const updatedDishes = that.data.recommendMealDishes.concat([{
                dishImageUrl: dishData.dishImageUrl,
                mealId: mealId,
                mealName: (that.data.recommendedMeals.find(meal => meal._id === mealId) || {}).mealName || '默认团餐名称'
              }]);
              that.setData({
                recommendMealDishes: updatedDishes // 更新轮播图的菜品数组
              });
              console.log("recommendMealDishes:",this.data.recommendMealDishes)
            }
          },
          fail: err => {
            console.error('cloudGetDishById 调用失败:', err);
          }
        });
      } else {
        console.log('没有找到菜品ID数组或数组为空');
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
           url: '/pages/mealDetail/index?mealId=' + mealId + '&mode=view',
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
    // Navigate to mealDetail page on success
    wx.navigateTo({
      url: '/pages/createMeal/index',
    })
  },
  //分享当前页面
  onShareAppMessage: function() {
    return {
      title: '宴聚-多人共享点餐',
      path: '/pages/index/index',
      imageUrl: '/assets/yan-ju-meal.jpg'
    }
  },  
});
