const { loginCheck } = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')

// 设置取cookie过期时间
const setCookieExpire = () => {
  const d = new Date()
  d.setTime(d.getTime() + (24 * 60 * 60 * 1000))
  return d.toGMTString()
}

const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const result = loginCheck(username, password)
    return result.then(userData => {
      if(userData.username) {
        // 操作cookie
        res.setHeader('Set-Cookie', `username=${userData.username}; path=/; HttpOnly; expires=${setCookieExpire()}`)
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