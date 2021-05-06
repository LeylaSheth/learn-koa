const fs = require('fs')
module.exports = (app) => {
  // 读取当前目录下除了index以外的文件
  fs.readdirSync(__dirname).forEach(file => {
    if (file === 'index.js') return
    const route = require(`./${file}`)
      // 迭代注册路由，以及相关方法
    app.use(route.routes()).use(route.allowedMethods())
  })
}