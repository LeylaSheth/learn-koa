const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/users')
const Question = require('../models/questions')
const Answer = require('../models/answers')
const { secret } = require('../config')


class UsersCtl {
  async find(ctx) {
    const { per_page = 10 } = ctx.query
    const perPage = Math.max(per_page * 1, 1)
    const page = Math.max(ctx.query.page * 1, 1) - 1
    ctx.body = await Topic.find().limit(perPage).skip(page * perPage)
  }

  async findById(ctx) {
    let user = null
    if (ctx.query.fields) {
      const { fields } = ctx.query
      const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('')
      const populateStr = fields.split(';').filter(f => f).map(f => {
        if (f === 'employments') {
          return 'employments.company employments.job'
        }
        if (f === 'educations') {
          return 'educations.school educations.major'
        }
        return f
      }).join(' ')
      user = await (await User.findById(ctx.params.id).select(selectFields)).populate(populateStr)
    } else {
      user = await User.findById(ctx.params.id)
    }
    if (!user) ctx.throw(404, "用户不存在")
    ctx.body = user
  }

  async create(ctx) {
    // required 默认为true
    ctx.verifyParams({
        name: { type: 'string', required: true },
        password: { type: 'string', required: true }
      })
      // 唯一性校验
    const { name } = ctx.request.body
    const repeatedUser = await User.findOne({ name })
    if (repeatedUser) ctx.throw(409, "用户已存在")
    const user = await new User(ctx.request.body).save()
    ctx.body = user
  }

  async update(ctx) {
    ctx.verifyParams({
        name: { type: 'string', required: false },
        password: { type: 'string', required: false },
        avatar_url: { type: 'string', required: false },
        gender: { type: 'string', required: false },
        headline: { type: 'string', required: false },
        locations: { type: 'array', itemType: 'string', required: false },
        business: { type: 'string', required: false },
        employments: { type: 'array', itemType: 'object', required: false },
        educations: { type: 'array', itemType: 'object', required: false },
      })
      // 唯一性校验
    const { name } = ctx.request.body
    const repeatedUser = await User.findOne({ name })
    if (repeatedUser) ctx.throw(409, "用户已存在")
    const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body)
    if (!user) ctx.throw(404, "用户不存在")
    ctx.body = user
  }

  async delete(ctx) {
    const user = await User.findByIdAndRemove(ctx.params.id)
    if (!user) ctx.throw(404, "用户不存在")
    ctx.status = 204
  }

  async login(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true }
    })
    const user = await User.findOne(ctx.request.body)
    if (!user) ctx.throw(401, '用户名或密码不正确')
    const { _id, name } = user
    const token = jsonwebtoken.sign({ _id, name }, secret, { expiresIn: '1d' })
    ctx.body = { token }
  }

  async checkOwner(ctx, next) {
    if (ctx.params.id !== ctx.state.user._id) {
      ctx.throw(403, "没有权限")
    }
    await next()
  }


  // 校验用户是否存在

  async checkUserExist(ctx, next) {
    const user = await User.findById(ctx.params.id)
    if (!user) ctx.throw(404, "用户不存在")
    await next()
  }
  async listFollowing(ctx) {
    // 在schema中定义了ref，可以通过populate获取粉丝详细信息
    const user = await User.findById(ctx.params.id).select('+following').populate('following')
    if (!user) ctx.throw(404)
    ctx.body = user.following
  }

  // 粉丝列表
  async listFollowers(ctx) {
    const users = await User.find({ following: ctx.params.id })
    if (!users) ctx.throw(404)
    ctx.body = users
  }

  async listFollowingTopics(ctx) {
    // 在schema中定义了ref，可以通过populate获取粉丝详细信息
    const user = await User.findById(ctx.params.id).select('+followingTopics').populate('followingTopics')
    if (!user) ctx.throw(404)
    ctx.body = user.followingTopics
  }


  async follow(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+following')
    if (!me.following.map(id => id.toString()).includes(ctx.params.id)) {
      me.following.push(ctx.params.id)
      me.save()
    }
    ctx.status = 204
  }

  async checkTopicExist(ctx, next) {
    const topic = await Topic.findById(ctx.params.id)
    if (!topic) ctx.throw(404, "话题不存在")
    await next()
  }

  async unfollow(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+following')
    const index = me.following.map(id => id.toString()).indexOf(ctx.params.id)
    if (index > -1) {
      me.following.splice(index, 1)
      me.save()
    }
    ctx.status = 204
  }

  async followTopic(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+followingTopics')
    if (!me.followingTopics.map(id => id.toString()).includes(ctx.params.id)) {
      me.followingTopics.push(ctx.params.id)
      me.save()
    }
    ctx.status = 204
  }

  async unfollowTopic(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+followingTopics')
    const index = me.followingTopics.map(id => id.toString()).indexOf(ctx.params.id)
    if (index > -1) {
      me.followingTopics.splice(index, 1)
      me.save()
    }
    ctx.status = 204
  }

  async listQuestions(ctx) {
    const questions = await Question.find({ questioner: ctx.params.id })
    ctx.body = questions
  }

  async listLikingAnswers(ctx) {
    // 在schema中定义了ref，可以通过populate获取粉丝详细信息
    const user = await User.findById(ctx.params.id).select('+likingAnswers').populate('likingAnswers')
    if (!user) ctx.throw(404)
    ctx.body = user.likingAnswers
  }


  async likeAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user._id).select('+likingAnswers')
    if (!me.likingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
      me.likingAnswers.push(ctx.params.id)
      me.save()
      await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } })
    }
    ctx.status = 204
    await next()
  }

  async unlikeAnswer(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+likingAnswers')
    const index = me.likingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
    if (index > -1) {
      me.likingAnswers.splice(index, 1)
      me.save()
      await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: -1 } })
    }
    ctx.status = 204

  }

  async listDislikingAnswers(ctx) {
    // 在schema中定义了ref，可以通过populate获取粉丝详细信息
    const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers')
    if (!user) ctx.throw(404)
    ctx.body = user.dislikingAnswers
  }


  async dislikeAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers')
    if (!me.dislikingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
      me.dislikingAnswers.push(ctx.params.id)
      me.save()
    }
    ctx.status = 204
    await next()
  }

  async undislikeAnswer(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers')
    const index = me.dislikingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
    if (index > -1) {
      me.dislikingAnswers.splice(index, 1)
      me.save()
    }
    ctx.status = 204
  }
}

module.exports = new UsersCtl()