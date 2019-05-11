const { loginCheck } = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')


const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='GET' && path==='/api/user/login') {
    // const { username, password } = req.body
    const { username, password } = req.query
    const result = loginCheck(username, password)
    return result.then(userData => {
      if(userData.username) {
        // 操作cookie
        res.setHeader('Set-Cookie', `username=${userData.username}; path=/`)
        return new SuccessModel(userData)
      }
      return new ErrorModel('登录失败')
    })
  }

  // 登录验证
  if(method==='GET' && path==='/api/user/login-test') {
    if(req.cookie.username) {
      return Promise.resolve(new SuccessModel({
        username: req.cookie.username
      }))
    }
    return  Promise.resolve(new ErrorModel('未登录'))
  }
}

module.exports = handleUserRouter