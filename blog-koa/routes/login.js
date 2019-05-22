const router = require('koa-router')()

router.prefix('/login')

router.post('/login', async (ctx, next) => {
  const { username, password } = ctx.request.body
  ctx.body = {
    code: 2000,
    username,
    password,
  }
})

module.exports = router