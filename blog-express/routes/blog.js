const express = require('express')
const router = express.Router()

// controller
const { getList, getDetail, newBlog, updateBlog, delBlog } = require('../controller/blog')

// model
const { SuccessModel, ErrorModel } = require('../model/resModel')

const loginCheckSession = require('../middleware/loginCheckSession')


router.get('/list', loginCheckSession, (req, res, next) => {
  let author = req.query.author
  const keyword = req.query.keyword
  // 管理员界面
  if(req.query.isadmin) {
    if(req.session.username==null) {
      res.json(new ErrorModel('未登录'))
      return
    }
    // 强制只查询登陆用户自己的博客
    author = req.session.username
  }

  const result = getList(author, keyword)
  return result.then(listData => {
     res.json(new SuccessModel(listData))
  })

})

// 获取博客详情
router.get('/detail', (req, res, next) => {
  const id = req.query.id
  let detailResult = getDetail(id)
  return detailResult.then(detailData => {
    res.json(new SuccessModel(detailData))
  })
})

// 新建一篇博客
router.post('/new', loginCheckSession, (req, res, next) => {
  const author = req.session.username  // 替换req.query.author
  req.body.author = author
  const blogData = req.body
  const dataResult = newBlog(blogData)
  return dataResult.then(data => {
     res.json(new SuccessModel(data))
  })
})

// 更新一篇博客
router.post('/update', loginCheckSession, (req, res, next) => {
  const id = req.query.id
  const result = updateBlog(id, req.body)
  return result.then(val => {
    if(val) {
       res.json(new SuccessModel(val))
    } else {
      res.json(new ErrorModel(val))
    }
  })
})

// 删除一篇博客
router.post('/del', loginCheckSession, (req, res, next) => {
  const id = req.query.id
  const author = req.session.username
  let result = delBlog(id, author)
  return result.then(val => {
    if(val) {
      res.json(new SuccessModel(val))
    } else {
      res.json(new ErrorModel(val))
    }
  })
})


module.exports = router