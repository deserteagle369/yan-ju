//getThirdLevelIngredients获取三级分类Ingredient
const cloud = require('wx-server-sdk')
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
    try {
        const db = cloud.database();
        const $ = db.command.aggregate;
        const result = await db.collection('ingredients').aggregate()
           .match({
                level: 3
            })
            .group({
                _id: '$Ingredient',
                IngredientName: $.first('$Ingredient'),
                IngredientImage: $.first('$IngredientImage'),
                IngredientDescription: $.first('$IngredientDescription'),                
            })
            .project({  
                _id: 0, 
                IngredientName: '$IngredientName',  
                IngredientImage: '$IngredientImage',                
                IngredientDescription: '$IngredientDescription'                
            })
            .end();
        return result.list
        console.log("云函数getThirdLevelIngredients返回的result:",result.list);
    } catch (e) {
        console.error(e)
    }
}
