const express = require('express')
const router = express.Router()

router.post('/login', (req, res, next) => {
  // 登录
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

})


module.exports = router