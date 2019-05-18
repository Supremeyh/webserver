const express = require('express')
const router = express.Router()

// controller
const { getList, getDetail, newBlog, updateBlog, delBlog } = require('../controller/blog')

// model
const { SuccessModel, ErrorModel } = require('../model/resModel')

// const { loginCheckSession } = require('../utils')


router.get('/list', (req, res, next) => {
  let author = req.query.author || ''
  const keyword = req.query.keyword || '' 
  // 管理员界面
  // if(req.query.isadmin) {
  //   // 登录验证
  //   const loginCheckResult = loginCheckSession(req)
  //   if(loginCheckResult) {  // 有值，说明未登录
  //     return loginCheckResult
  //   }
  //   // 强制只查询登陆用户自己的博客
  //   author = req.session.username
  // }

  const result = getList(author, keyword)
  return result.then(listData => {
     res.json(new SuccessModel(listData))
  })

})

module.exports = router