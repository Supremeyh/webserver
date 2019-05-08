const { loginCheck } = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')


const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const result = loginCheck(username, password)
    if(result) {
      return new SuccessModel(result)
    } else {
      return new ErrorModel(result)
    } 
  }
}

module.exports = handleUserRouter