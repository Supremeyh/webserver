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

router.get('/test', async (ctx, next) => {
  if(ctx.session.viewNum==null) {
    ctx.session.viewNum = 0
  }
  ctx.session.viewNum++ 

  ctx.body = {
    code: 2000,
    viewNum: ctx.session.viewNum
  }
})

module.exports = router