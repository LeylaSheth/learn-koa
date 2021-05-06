const Question = require('../models/questions')

class QuestionsCtl {
  async find(ctx) {
    // 每一页十项，跳过第一页的10项
    // ctx.body = await Topic.find().limit(10).skip(10)
    const { per_page = 10 } = ctx.query
    const perPage = Math.max(per_page * 1, 1)
    const page = Math.max(ctx.query.page * 1, 1) - 1
    const q = new RegExp(ctx.query.q)
      // 模糊搜索，两个都匹配
    ctx.body = await Question.find({ $or: [{ title: q }, { description: q }] }).limit(perPage).skip(page * perPage)
  }

  async checkQuestionExist(ctx, next) {
    const question = await Question.findById(ctx.params.id).select('+questioner')
    if (!question) ctx.throw(404, '问题不存在')
      // 存入state，减少查询
    ctx.state.question = question
    await next()
  }

  async findById(ctx) {
    const { fields = '' } = ctx.query
    const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('')
    const question = await Question.findById(ctx.params.id).select(selectFields).populate('questioner topics')
    ctx.body = question
  }

  async create(ctx) {
    ctx.verifyParams({
      title: { type: 'string', required: true },
      description: { type: 'string', required: false },
    })

    const question = await new Question({...ctx.request.body, questioner: ctx.user.state.user_id }).save()
    ctx.body = question
  }

  async checkQuestioner(ctx, next) {
    const { question } = ctx.state
    if (question.questioner.toString() !== ctx.state.user._id) ctx.throw(403, "没有权限")
    await next()
  }

  async update(ctx) {
    ctx.verifyParams({
      title: { type: 'string', required: true },
      description: { type: 'string', required: false },
    })
    await ctx.state.question.update(ctx.request.body)
      // 返回更新前的topic
    ctx.body = ctx.state.question
  }

  async delete(ctx) {
    await Question.findByIdAndRemove(ctx.params.id)
    ctx.status = 204
  }
}

module.exports = new QuestionsCtl()