const { loginCheck } = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')
const { setCookieExpire } = require('../utils')


const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const result = loginCheck(username, password)
    return result.then(userData => {
      if(userData.username) {
        // 设置session
        req.session.username = userData.username
        
        // 操作cookie
        // res.setHeader('Set-Cookie', `username=${userData.username}; path=/; HttpOnly; expires=${setCookieExpire()}`)
        return new SuccessModel(userData)
      }
      return new ErrorModel('登录失败')
    })
  }

  // 登录验证
  // if(method==='GET' && path==='/api/user/login-test') {
  //   if(req.session.username) {
  //     return Promise.resolve(new SuccessModel({
  //       session: req.session
  //     }))
  //   }
  //   return  Promise.resolve(new ErrorModel('未登录'))
  // }
}

module.exports = handleUserRouter