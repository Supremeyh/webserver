const router = require('koa-router')()

const { loginCheck } = require('../controller/login')
const { SuccessModel, ErrorModel } = require('../model/resModel')

router.prefix('/login')

// 登录
router.post('/login', async (ctx, next) => {
  // 登录
  const { username, password } = ctx.request.body
  const userData = await loginCheck(username, password)
  if(userData.username) {
    // 设置 session 会自动同步到redis
    ctx.session.username = userData.username
    ctx.body = new SuccessModel(userData, '登录成功')
    return
  }
  ctx.body = new ErrorModel('登录失败')
})


module.exports = router