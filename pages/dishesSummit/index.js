Page({ 
  data: { 
    dishName: '', 
    categories: ['肉类', '禽类','海鲜', '蔬菜', '汤类', '冷菜', '主食', '甜品和饮料'], // 菜品分类// 
    selectedCategory: '', // 默认提示// 
    selectedIngredients: [], // 存储已选的食材// 
    time: '', 
    spicyLevels: ['不辣', '微辣', '中辣', '辣', '特辣'], 
    selectedSpicyLevel: '请选择辣度', 
    ingredientsCategories: [[],[],[]], // 初始化空数组，将通过函数填充// 
    selectedIngredientsIndex: [0, 0, 0], // 默认选中的三级分类索引// 
    dishImageUrl: '', // 菜品图片URL// 
  }, 
  onLoad: function() { // 假设这个函数是你用来初始化食材分类数据的//
    this.initializeCookingTimes(); 
    this.initIngredientsCategories(); 
  }, 
  inputName(e) { 
    this.setData({ dishName: e.detail.value }); 
  }, 
  initializeCookingTimes: function() { 
    let times = []; 
    for (let i = 5; i <= 120; i += 5) { 
      times.push(i + '分钟'); 
    } 
    this.setData({ cookingTimes: times }); 
    console.log(this.data.selectedIngredientsIndex) 
  }, 
  onCategoryChange: function(e) { 
    this.setData({ 
      selectedCategory: this.data.categories[e.detail.value] 
    }); 
  }, 

  initIngredientsCategories: function () {
    const db = wx.cloud.database();
    const $ = db.command.aggregate;
  
    db.collection('ingredients')
      .aggregate()
      .group({
        _id: null,
        distinctCategories: $.addToSet('$Category')
      })
      .end()
      .then((res) => {
        this.setData({
          ingredientsCategories: [res.list[0].distinctCategories],
        });
      })
      .catch((err) => {
        console.error('Error fetching first-level categories:', err);
      });
  },

onPickIngredient: function(e) { 
  const { value } = e.detail; 
  let newSelectedIngredients = this.data.selectedIngredients.slice(); 
  let newIngredient = { 
    category: this.data.ingredientsCategories[0][value[0]], 
    subcategory: this.data.ingredientsCategories[1][value[1]], 
    name: this.data.ingredientsCategories[2][value[2]], 
  }; 
  newSelectedIngredients.push(newIngredient); 
  this.setData({ 
    selectedIngredients: newSelectedIngredients 
  }); 
},

removeIngredient: function(e) { 
  const index = e.currentTarget.dataset.index; 
  let newSelectedIngredients = this.data.selectedIngredients.slice(); 
  newSelectedIngredients.splice(index, 1); 
  this.setData({ 
    selectedIngredients: newSelectedIngredients 
  }); 
}, 
onColumnChange: function(e) { 
  const { column, value } = e.detail; 
  let data = { 
    ingredientsCategories: this.data.ingredientsCategories, 
    selectedIngredientsIndex: this.data.selectedIngredientsIndex 
  };
  data.selectedIngredientsIndex[column] = value;
  const db = wx.cloud.database();
  if (column === 0) { // 当一级分类改变时// 
    const selectedCategory = this.data.ingredientsCategories[0][value]; 
    db.collection('ingredients').where({ Category: selectedCategory }).get().then(res => { 
      const subcategories = res.data.map(item => item.Subcategory); 
      const newSubcategories = [...new Set(subcategories)]; // 去重// 
      data.ingredientsCategories[1] = newSubcategories;
      // 重置后续选择//
      data.ingredientsCategories[2] = [];
      data.selectedIngredientsIndex[1] = -1;
      data.selectedIngredientsIndex[2] = -1;
      // 更新食材名称数组//
      if (newSubcategories.length > 0) {
          const firstSubcategory = newSubcategories[0];
          db.collection('ingredients').where({
              Subcategory: firstSubcategory
          }).get().then(res => {
              const ingredients = res.data.map(item => item.Ingredient);
              data.ingredientsCategories[2] = ingredients;
              this.setData(data);
          });
      } else {
          this.setData(data);
      }
  });
} else if (column === 1) { // 当二级分类改变时// 
  const selectedSubcategory = data.ingredientsCategories[1][value]; 
  db.collection('ingredients').where({ 
    Subcategory: selectedSubcategory 
  }).get().then(res => { 
    const ingredients = res.data.map(item => item.Ingredient); 
    data.ingredientsCategories[2] = ingredients;
      // 重置食材选择//
      data.selectedIngredientsIndex[2] = -1;
      this.setData(data);
  });
} else { // 如果是其他列改变，目前只有三列，所以不需要额外逻辑// 
  this.setData(data); 
} 
},

pickSpicy(e) { 
  this.setData({ 
    selectedSpicyLevel: this.data.spicyLevels[e.detail.value] 
  }); 
}, 
bindTimeChange: function(e) { 
  const selectedTime = this.data.cookingTimes[e.detail.value]; 
  this.setData({ time: selectedTime 
  }); 
}, 
uploadImage() { 
  const that = this; 
  wx.chooseImage({ 
    count: 1, // 默认为1// 
    sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有// 
    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有// 
    success(res) { // 返回选定照片的本地文件路径列表// 
      const tempFilePaths = res.tempFilePaths; 
      const cloudPath = `dishImages/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}.png`;
        wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePaths[0],
            success: res => {
                console.log('上传成功', res)
                that.setData({
                    dishImageUrl: res.fileID // 更新图片路径//
                });
            },
            fail: e => {
                console.error(e)
                wx.showToast({
                    title: '图片上传失败',
                    icon: 'none'
                });
            }
        });
    }
});
}, 
submitDish: function() { // 提交菜品信息的逻辑// 
  console.log(this.data); // 确保所有字段都已填写// 
  if (this.data.dishName && 
    this.data.selectedCategory && 
    this.data.selectedIngredients && 
    this.data.time && 
    this.data.selectedSpicyLevel && 
    this.data.dishImageUrl) { // 此处调用云函数提交数据，以下为伪代码// 
      wx.cloud.callFunction({ 
        name: 'createDish', 
        data: { 
          dishName: this.data.dishName, 
          selectedCategory: this.data.selectedCategory, 
          Ingredient: this.data.Ingredient, 
          selectedIngredients: this.data.selectedIngredients, 
          time: this.data.time, 
          selectedSpicyLevel: this.data.selectedSpicyLevel, 
          dishImageUrl: this.data.dishImageUrl 
        }, 
        success: function(res) { 
          wx.showToast({ 
            title: '提交成功', 
          }); 
        }, 
        fail: function(err) { 
          wx.showToast({ 
            title: '提交失败', 
            icon: 'none', 
          }); 
          console.error('调用失败：', err); 
        } 
      }); 
    } else { 
      wx.showToast({ 
        title: '请填写所有信息', 
        icon: 'none', 
      }); 
    } 
}, 
});