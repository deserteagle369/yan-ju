// pages/dishDetail/index.js
Page({  
  data: {  
    dishData: {}, // 菜品数据  
    dishName: '',  
    selectedCategory: '',  
    selectedIngredients: [],  
    selectedSpicyLevel: '',  
    time: '',  
    dishImageUrl: '',  
    createdAt: '',
    openid: '', // 当前用户的 openid  
    isOwner: false, // 是否是当前用户提交的菜品  
    avatarUrl: '', // 用户头像的URL  
    nickName: '' ,  // 用户昵称
    authorId: '', // 菜品作者的openid
    // 其他页面需要的数据...  
  },  
  
  onLoad: function(options) {  
    // 假设 options 中包含了菜品 ID  
    const dishId = options.dishId; // 从路由或其他方式获取到的菜品ID  
    console.log("dishDetail页面参数dishId:", dishId);
    const app = getApp();
    let openid = app.globalData.openid;
    console.log("onLoad函数中从缓存中获取的openid：", openid);
    console.log("onLoad函数中从缓存中获取的userInfo：", app.globalData.userInfo);
    this.setData({ 
      openid,
      userInfo: app.globalData.userInfo || {} }); // 存储openid到页面实例的data中
    
    // 调用云函数获取菜品详情  
    this.getDishDetail(dishId);  
  },  
  
  getDishDetail: function(dishId) {    
    console.log("start getDishDetail with:", dishId);  
    // 使用箭头函数来保持this的上下文  
    wx.cloud.callFunction({    
      name: 'cloudGetDishById', // 云函数名称    
      data: {    
        dishId: dishId // 传递给云函数的参数    
      },    
      success: res => {  
        // 假设 res.result 是从云函数返回的数据  
        console.log('Dish detail:', res.result);
        console.log('res.result.openid:', res.result.openid);
        this.setData({  
          dishName: res.result.dishName,  
          selectedCategory: res.result.selectedCategory,  
          selectedIngredients: res.result.selectedIngredients,  
          selectedSpicyLevel: res.result.selectedSpicyLevel,  
          time: res.result.time,  
          dishImageUrl: res.result.dishImageUrl,  
          createdAt: res.result.createdAt,
          isOwner: res.result.openid === this.data.openid, // 判断当前用户是否为菜品提交者
          authorId: res.result.openid.slice(-4), // 获取openid的后四位作为作者ID  
          authorAvatarUrl: res.result.avatarUrl || '', // 获取用户头像的URL  
        });  
      },  
      fail: err => {  
        // 处理错误  
        console.error('Error fetching dish detail:', err);  
        wx.showToast({  
          title: '获取菜品详情失败',  
          icon: 'none',  
          duration: 2000  
        });  
      }  
    });  
  },  
});