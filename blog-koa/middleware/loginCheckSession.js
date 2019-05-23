const { ErrorModel } = require('../model/resModel')

const loginCheckSession = async (rctx, next) => {
  if(ctx.session.username) {
    await next()
    return
  }
  ctx.body = new ErrorModel('未登录')
}

module.exports = loginCheckSession