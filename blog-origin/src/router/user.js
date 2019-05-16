const { loginCheck } = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')
const { setRedisVal } = require('../db/redis')

const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const loginResult = loginCheck(username, password)
    return loginResult.then(userData => {      
      if(userData.username) {
        // 设置 session
        req.session.username = userData.username
                
        // 同步到 redis
        setRedisVal(req.sessionId, req.session)

        return new SuccessModel(userData, '登录成功')
      }
      return new ErrorModel('登录失败')
    })
  }
}

module.exports = handleUserRouter