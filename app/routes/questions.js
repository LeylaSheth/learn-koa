const Router = require('koa-router')
const jwt = require('koa-jwt')
  // 配置前缀
const router = new Router({ prefix: '/questions' })

const { find, findById, create, update, delete: del, checkQuestionExist, checkQuestioner } = require('../controllers/questions')

const { secret } = require('../config')

const auth = jwt({ secret })

// const auth = async(ctx, next) => {
//   const { authorization = '' } = ctx.request.header
//   const token = authorization.replace("Bearer ", '')
//   try {
//     const user = jsonwebtoken.verify(token, secret)
//     ctx.state.user = user
//   } catch (err) {
//     ctx.throw(401, err.message)
//   }
//   await next()
// }

router.get('/', find)

router.post('/', auth, create)

router.get('/:id', checkQuestionExist, findById)

router.patch('/:id', auth, checkQuestionExist, checkQuestioner, update)

router.delete('/:id', auth, checkQuestionExist, checkQuestioner, del)



module.exports = router