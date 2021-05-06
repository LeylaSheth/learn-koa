const Comment = require('../models/comments')

class CommentsCtl {
  async find(ctx) {
    // 每一页十项，跳过第一页的10项
    // ctx.body = await Topic.find().limit(10).skip(10)
    const { per_page = 10 } = ctx.query
    const perPage = Math.max(per_page * 1, 1)
    const page = Math.max(ctx.query.page * 1, 1) - 1
    const q = new RegExp(ctx.query.q)
    const { questionId, answerId } = ctx.params
    const { rootCommentId } = ctx.query
      // 模糊搜索，两个都匹配
    ctx.body = await Comment.find({ content: q, questionId, answerId, rootCommentId }).limit(perPage).skip(page * perPage).populate('commentator replyTo')
  }

  async checkCommentExist(ctx, next) {
    const comment = await Comment.findById(ctx.params.id).select('+commentator')
    if (!comment) ctx.throw(404, '评论不存在')
      // 赞踩时不抛出
    if (ctx.params.questionId && comment.questionId !== ctx.params.questionId) ctx.throw(404, '该问题下没有此评论')
    if (ctx.params.answerId && comment.answerId !== ctx.params.answerId) ctx.throw(404, '该答案下没有此评论')
      // 存入state，减少查询
    ctx.state.comment = comment
    await next()
  }

  async findById(ctx) {
    const { fields = '' } = ctx.query
    const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('')
    const comment = await Comment.findById(ctx.params.id).select(selectFields).populate('commentator')
    ctx.body = comment
  }

  async create(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
      rootCommentId: { type: 'string', required: false },
      replyTo: { type: 'string', required: false }
    })

    const comment = await new Comment({...ctx.request.body, commenter: ctx.user.state.user_id, questionId: ctx.params.questionId, answerId: ctx.params.answerId, rootCommentId: ctx.params.rootCommentId, replyTo: ctx.params.replyTo }).save()
    ctx.body = comment
  }

  async checkCommentator(ctx, next) {
    const { comment } = ctx.state
    if (comment.commentator.toString() !== ctx.state.user._id) ctx.throw(403, "没有权限")
    await next()
  }

  async update(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: false },
    })
    const { content } = ctx.request.body
    await ctx.state.comment.update({ content })
      // 返回更新前的topic
    ctx.body = ctx.state.comment
  }

  async delete(ctx) {
    await Comment.findByIdAndRemove(ctx.params.id)
    ctx.status = 204
  }
}

module.exports = new CommentsCtl()