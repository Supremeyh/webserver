const router = require('koa-router')()

router.prefix('/blog')

router.get('/list', async (ctx, next) => {
  ctx.body = {
    code: 2000,
    query: ctx.query,
    ctx: ctx,
    data: [2, 3, 5]
  }
})

module.exports = router