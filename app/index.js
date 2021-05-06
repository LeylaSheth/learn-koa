const Koa = require('koa')
const koaBody = require('koa-body')
const koaStatic = require('koa-static')
const error = require('koa-json-error')
const parameter = require('koa-parameter')
const mongoose = require('mongoose')
const path = require('path')
const { connectionStr } = require('./config')
const app = new Koa()

mongoose.connect(connectionStr, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log("connect success"))
mongoose.connection.on('error', console.error)

const routing = require('./routes')

// next指后面的中间件
// app.use(async(ctx, next) => {
//   try {
//     await next()
//   } catch (err) {
//     // 处理throw错误，404没有走中间件
//     ctx.status = err.status || err.statusCode || 500;
//     ctx.body = {
//       message: err.message
//     }
//   }
// });

app.use(koaStatic(path.join(__dirname, 'public')))

app.use(error({
  postFormat: (err, { stack, ...rest }) => process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
}))


// 处理body的中间件，支持图片
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join(__dirname, '/public/uploads'),
    // 保留扩展名。jpg、png
    keepExtensions: true
  }
}));
// 校验请求体的中间件
app.use(parameter(app))
  // 批量处理路由
routing(app);

app.listen(3000, () => console.log("running success on localhost:3000"))