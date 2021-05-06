const Topic = require('../models/topics')
const User = require('../models/users')
const Question = require('../models/questions')

class TopicsCtl {
  async find(ctx) {
    // 每一页十项，跳过第一页的10项
    // ctx.body = await Topic.find().limit(10).skip(10)
    const { per_page = 10 } = ctx.query
    const perPage = Math.max(per_page * 1, 1)
    const page = Math.max(ctx.query.page * 1, 1) - 1
      // 模糊搜索
    ctx.body = await Topic.find({ name: new RegExp(ctx.query.q) }).limit(perPage).skip(page * perPage)
  }

  async findById(ctx) {
    const { fields = '' } = ctx.query
    const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('')
    const topic = await Topic.findById(ctx.params.id).select(selectFields)
    ctx.body = topic
  }

  async create(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: true },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false }

    })

    const topic = await new Topic(ctx.request.body).save()
    ctx.body = topic
  }

  async update(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false },
    })
    const topic = await Topic.findByIdAndUpdate(ctx.params.id, ctx.request.body)
      // 返回更新前的topic
    ctx.body = topic
  }

  // 关注话题的人列表
  async listTopicFollowers(ctx) {
    const users = await User.find({ followingTopics: ctx.params.id })
    if (!users) ctx.throw(404)
    ctx.body = users
  }

  async listQuestions(ctx) {
    const questions = await Question.find({ topics: ctx.params.id })
    ctx.body = questions
  }
}

module.exports = new TopicsCtl()