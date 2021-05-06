const Answer = require('../models/answers')

class AnswersCtl {
  async find(ctx) {
    // 每一页十项，跳过第一页的10项
    // ctx.body = await Topic.find().limit(10).skip(10)
    const { per_page = 10 } = ctx.query
    const perPage = Math.max(per_page * 1, 1)
    const page = Math.max(ctx.query.page * 1, 1) - 1
    const q = new RegExp(ctx.query.q)
      // 模糊搜索，两个都匹配
    ctx.body = await Answer.find({ content: q, questionId: ctx.params.questionId }).limit(perPage).skip(page * perPage)
  }

  async checkAnswerExist(ctx, next) {
    const answer = await Answer.findById(ctx.params.id).select('+answerer')
    if (!answer) ctx.throw(404, '答案不存在')
      // 赞踩时不抛出
    if (ctx.params.questionId && answer.questionId !== ctx.params.questionId) ctx.throw(404, '该问题下没有此答案')
      // 存入state，减少查询
    ctx.state.answer = answer
    await next()
  }

  async findById(ctx) {
    const { fields = '' } = ctx.query
    const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('')
    const answer = await Answer.findById(ctx.params.id).select(selectFields).populate('answerer')
    ctx.body = answer
  }

  async create(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
    })

    const answer = await new Answer({...ctx.request.body, answerer: ctx.user.state.user_id, questionId: ctx.params.questionId }).save()
    ctx.body = answer
  }

  async checkAnswerer(ctx, next) {
    const { answer } = ctx.state
    if (answer.answerer.toString() !== ctx.state.user._id) ctx.throw(403, "没有权限")
    await next()
  }

  async update(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
    })
    await ctx.state.answer.update(ctx.request.body)
      // 返回更新前的topic
    ctx.body = ctx.state.answer
  }

  async delete(ctx) {
    await Answer.findByIdAndRemove(ctx.params.id)
    ctx.status = 204
  }
}

module.exports = new AnswersCtl()