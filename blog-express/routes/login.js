const express = require('express')
const router = express.Router()
const { loginCheck } = require('../controller/login')
const { SuccessModel, ErrorModel } = require('../model/resModel')

router.post('/login', (req, res, next) => {
  // 登录
  const { username, password } = req.body
  const loginResult = loginCheck(username, password)
  return loginResult.then(userData => {      
    if(userData.username) {
      // 设置 session 会自动同步到redis
      req.session.username = userData.username
              
      // 同步到 redis
      // setRedisVal(req.sessionId, req.session)
      res.json(new SuccessModel(userData, '登录成功'))
      return
    }
    res.json(new ErrorModel('登录失败'))
  })

})


module.exports = router