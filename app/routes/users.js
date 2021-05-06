const Router = require('koa-router')
const jsonwebtoken = require('jsonwebtoken')
const jwt = require('koa-jwt')
  // 配置前缀
const router = new Router({ prefix: '/users' })

const { find, findById, create, update, delete: del, login, checkOwner, listFollowing, follow, unfollow, listFollowers, checkUserExist, followTopic, checkTopicExist, unfollowTopic, listFollowingTopics, listQuestions, listLikingAnswers, likeAnswer, unlikeAnswer, listDislikingAnswers, dislikeAnswer, undislikeAnswer } = require('../controllers/users')

const { secret } = require('../config')
const { checkAnswerExist } = require('../controllers/answers')

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

router.post('/', create)

router.get('/:id', findById)

router.patch('/:id', auth, checkOwner, update)

router.delete('/:id', auth, checkOwner, del)

router.post('/login', login)

router.get('/:id/following', listFollowing)

router.get('/:id/followers', listFollowers)

// 关注
router.put('/following/:id', auth, checkUserExist, follow)

// 取消关注
router.delete('/following/:id', auth, checkUserExist, unfollow)

router.get('/:id/followingTopics', listFollowingTopics)

router.put('/followingTopics/:id', auth, checkTopicExist, followTopic)

router.delete('/followingTopics/:id', auth, checkTopicExist, unfollowTopic)

router.get('/:id/questions', listQuestions)

router.get('/:id/likingAnswers', listLikingAnswers)

router.put('/likingAnswers/:id', auth, checkAnswerExist, likeAnswer, undislikeAnswer)

router.delete('/likingAnswers/:id', auth, checkAnswerExist, unlikeAnswer)

router.get('/:id/dislikingAnswers', listDislikingAnswers)

router.put('/dislikingAnswers/:id', auth, checkAnswerExist, dislikeAnswer, unlikeAnswer)

router.delete('/dislikingAnswers/:id', auth, checkAnswerExist, undislikeAnswer)



module.exports = router