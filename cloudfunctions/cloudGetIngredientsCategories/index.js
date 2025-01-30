// index.js 是云函数的入口文件
// 云函数名：getIngredientsCategories

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}

)

exports.main = async (event, context) => {
  try {
    const db = cloud.database();
    const $ = db.command;

    // 获取所有一级分类和对应的二级分类列表
    const firstLevelResult = await db.collection('ingredients')
      .aggregate()
      .match({
        // 这里可以添加一些匹配条件，如果需要的话
      })
      .group({
        _id: '$Category', // 按照Category字段分组
        subcategories: {
          $push: '$Subcategory' // 将Subcategory推入数组
        }
      })
      .project({
        _id: 0, // 不保留_id字段
        Category: '$_id',
        subcategories: 1
      })
      .end();

    // 提取一级分类数组
    const categories = firstLevelResult.list.map(item => item.Category);

    // 构建一级分类和二级分类的映射关系
    let categoriesMap = {};
    firstLevelResult.list.forEach(item => {
      categoriesMap[item.Category] = item.subcategories;
    });

    // 为每个一级分类获取二级分类下的三级分类
    const promises = categories.map(async (category) => {
      const subcategories = categoriesMap[category];
      const thirdLevelResults = await Promise.all(subcategories.map(async (subcategory) => {
        const ingredientsResult = await db.collection('ingredients')
          .where({
            Category: category,
            Subcategory: subcategory
          })
          .get();
          
        return {
          Subcategory: subcategory,
          Ingredients: ingredientsResult.data.map(item => item.Ingredient)
        };
        console.log("Subcategory:",Subcategory);
        console.log("Ingredients:",Ingredients)
      }));
      
      return {
        Category: category,
        Subcategories: thirdLevelResults
      };
      console.log("Category:",Category);
      console.log("Subcategories:",Subcategories);
    });

    // 等待所有Promise完成
    const categoriesWithSubcategoriesAndIngredients = await Promise.all(promises);

    return {
      code: 200,
      data: categoriesWithSubcategoriesAndIngredients
    };
    console.log("data:",data) ;
  } catch (e) {
    console.error(e);
    return {
      code: 500,
      msg: 'An error occurred while fetching categories.'
    };
  }
};