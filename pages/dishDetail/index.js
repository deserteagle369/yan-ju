// pages/dishDetail/index.js
const base = require('../../utils/language.js')
const _ = base._
Page({  
  data: {
    dishId: '', // 菜品 ID  
    dishDetail: null,
    dishData: {}, // 菜品数据  
    dishName: '',  
    dishCategory: '',  
    selectedIngredients: [],  
    selectedSpicyLevel: '',  
    time: '',  
    dishImageUrl: '',  
    createdAt: '',
    lastUpdatedAt: '',
    openid: '', // 当前用户的 openid  
    isOwner: false, // 是否是当前用户提交的菜品  
    avatarUrl: '', // 用户头像的URL  
    nickName: '' ,  // 用户昵称
    authorId: '', // 菜品作者的openid
    _t: '',
    // 其他页面需要的数据...  
  },  
  
  onLoad: function(options) {  
    this.mixinFn();
    wx.setNavigationBarTitle({
      title: _('菜品详情')
    })
    console.log("dishDetail onLoad options:", options);
    const dishId = options.dishId;
    console.log("dishDetail页面参数dishId:", dishId);
    
    if (dishId) {
      // 如果有 dishId，正常加载菜品数据
      this.setData({ dishId: dishId });
      this.initializePageData(dishId);
      this.getDishDetail(dishId)
      .catch(error => {
        console.error('初始加载菜品详情失败:', error);
        this.showErrorAndNavigateBack();
      });
    } else {
      // 如果没有 dishId，显示错误提示并返回首页
      console.error("No dishId received in dishDetail page");
      this.showErrorAndNavigateBack();
    }

    // 设置事件监听器
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && typeof eventChannel.on === 'function') {
      eventChannel.on('refreshPage', () => {
        console.log('Received refreshPage event in dishDetail page');
        this.getDishDetail(this.data.dishId);
      });
    } else {
      console.log('EventChannel not available or initialized');
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
  showErrorAndNavigateBack: function() {
    wx.showModal({
      title: '错误',
      content: '无法加载菜品信息，缺少必要参数',
      showCancel: false,
      success: (res) => {
        if (res.confirm) {
          // 用户点击确定后，返回上一页或首页
          wx.navigateBack({
            delta: 1,
            fail: () => {
              // 如果返回失败（可能是直接打开的这个页面），则跳转到首页
              wx.switchTab({
                url: '/pages/index/index'  // 请确保这是您首页的正确路径
              });
            }
          });
        }
      }
    });
  },

  initializePageData: async function(dishId) {
    try {
      console.log("Starting initializePageData with dishId:", dishId);  
      await this.setOpenId();
      console.log("OpenId set successfully");
  
      console.log("Fetching dish details:", dishId);
      await this.getDishDetail(dishId);
  
      // console.log("Initializing cooking times");
      // this.initializeCookingTimes();
      // console.log("Initializing ingredients categories");
      // await this.initIngredientsCategories();
      // console.log('Ingredients categories initialized successfully.');

      // 设置事件监听器
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && typeof eventChannel.on === 'function') {
      eventChannel.on('refreshPage', () => {
        console.log('Received refreshPage event in dishDetail page:',this.data.dishId);
        this.getDishDetail(this.data.dishId);
      });
    } else {
      console.log('EventChannel not available or initialized');
    }
    } catch (err) {
      console.error('Error initializing page data:', err);
      this.showErrorAndNavigateBack();
    }
  },

  setOpenId: function() {
    const app = getApp();
    return new Promise((resolve, reject) => {      
      const checkOpenId = () => {
        if (app.globalData.openid) {
          this.setData({ 
            openid: app.globalData.openid 
          });
          console.log("this.data.openid:", this.data.openid);
          resolve();
        } else {
          console.log("Waiting for openid...");
          setTimeout(checkOpenId, 100);
        }
      };
      checkOpenId();
    });
  },

  onPullDownRefresh: function() {
    console.log('用户触发了下拉刷新');
    if (this.data.dishId) {
      this.getDishDetail(this.data.dishId)
        .then(() => {
          // 数据刷新成功后,停止下拉刷新动画
          wx.stopPullDownRefresh();
        })
        .catch(error => {
          console.error('刷新数据失败:', error);
          wx.stopPullDownRefresh();
          wx.showToast({
            title: '刷新失败,请重试',
            icon: 'none'
          });
        });
    } else {
      console.error('无法刷新,缺少 dishId');
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新失败,请重新进入页面',
        icon: 'none'
      });
    }
  },

  getDishDetail: function(dishId) {
    return new Promise((resolve, reject) => {
      console.log("开始获取菜品详情,dishId:", dishId);
      if (!dishId) {
        console.error("未提供 dishId 给 getDishDetail");
        reject(new Error("未提供 dishId"));
        return;
      }

      wx.cloud.callFunction({
        name: 'cloudGetDishById',
        data: { dishIds: [dishId] },
        success: res => {
          console.log('收到云函数 cloudGetDishById 返回结果:', res.result);
          const dishDetails = res.result.data[0];
          console.log('结果中的openid:', dishDetails.openid);
          console.log('dishDetails:', dishDetails);
          this.setData({
            dishId: dishId,  
            dishName: dishDetails.dishName,  
            dishCategory: dishDetails.dishCategory,  
            selectedSpicyLevel: dishDetails.selectedSpicyLevel,  
            time: dishDetails.time,  
            dishImageUrl: dishDetails.dishImageUrl,  
            createdAt: dishDetails.createdAt,
            lastUpdatedAt: dishDetails.lastUpdatedAt, // 记录最后更新时间
            isOwner: dishDetails.openid === this.data.openid, // 判断当前用户是否为菜品提交者
            authorId: dishDetails.openid.slice(-4), // 获取openid的后四位作为作者ID  
            authorAvatarUrl: dishDetails.avatarUrl || '', // 获取用户头像的URL  
            });  
          console.log("this.data:", this.data);
          // 解析食材ID以获取详细信息
          const db = wx.cloud.database();
          const ingredientIds = dishDetails.selectedIngredients;
          db.collection('ingredients').where({
            _id: db.command.in(ingredientIds)
          }).get().then(ingRes => {
            const fullIngredients = ingRes.data.map(ing => ({
              selectedIngredientId: ing._id,
              selectedIngredient: ing.Ingredient,
              selectedCategory: ing.Category,
              selectedSubcategory: ing.Subcategory
            }));
            this.setData({
              selectedIngredients: fullIngredients
            });
            resolve(); // 解析 Promise
          }).catch(err => {
            console.error('获取食材详情失败:', err);
            reject(err);
          });
        },
        fail: err => {
          console.error('获取菜品详情失败:', err);
          reject(err);
        }
      });
    });
  },

  editDish: function() {
    const dishId = this.data.dishId; // 从页面数据中获取当前菜品的ID
    console.log("点击了编辑按钮，参数为dishId:", dishId);
    console.log("this.data.isOwner:",this.data.isOwner);
    if (this.data.isOwner) {
      wx.navigateTo({
        url: '/pages/dishSummit/index?dishId=' + dishId,
        success: res => {
          res.eventChannel.emit('acceptDataFromOpenerPage', {
            dishId: dishId,
            data: this.data // 传递当前页面的数据
          });
          res.eventChannel.on('refreshPage', () => {
            this.getDishDetail(this.data.dishId);
        });
      }
      });
    } else {
      wx.showToast({
        title: '只有创建者可以编辑',
        icon: 'none'
      });
    }
  },
});