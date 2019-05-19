const { ErrorModel } = require('../model/resModel')

const loginCheckSession = (req, res, next) => {
  if(req.session.username) {
    next()
    return
  }
  res.json(new ErrorModel('未登录'))
}

module.exports = loginCheckSession