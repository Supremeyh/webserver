// controller
const { getList, getDetail, newBlog, updateBlog, delBlog } = require('../controller/blog')

// model
const { SuccessModel, ErrorModel } = require('../model/resModel')

const { loginCheckSession } = require('../utils')

const handleBlogRouter = (req, res) => {
  const { method, url, path } = req


  // 获取博客列表
  if(method==='GET' && path==='/api/blog/list') {
    let author = req.query.author || ''
    const keyword = req.query.keyword || '' 
    
    // 管理员界面
    if(req.query.isadmin) {
      // 登录验证
      const loginCheckResult = loginCheckSession(req)
      if(loginCheckResult) {  // 有值，说明未登录
        return loginCheckResult
      }
      // 强制只查询登陆用户自己的博客
      author = req.session.username
    }

    const result = getList(author, keyword)
    return result.then(listData => {
      return new SuccessModel(listData)
    })
  }

  // 获取博客详情
  if(method==='GET' && path==='/api/blog/detail') {
    const id = req.query.id || ''
    let detailResult = getDetail(id)
    return detailResult.then(detailData => {
      return new SuccessModel(detailData)
    })
  }

  // 新建一篇博客
  if(method==='POST' && path==='/api/blog/new') {
    // 登录验证
    const loginCheckResult = loginCheckSession(req)
    if(loginCheckResult) {  // 有值，说明未登录
      return loginCheckResult
    }

    const author = req.session.username  // 替换req.query.author
    req.body.author = author
    
    const blogData = req.body
    const dataResult = newBlog(blogData)
    return dataResult.then(data => {
      return new SuccessModel(data)
    })
  }

  // 更新一篇博客
  if(method==='POST' && path==='/api/blog/update') {
    // 登录验证
    const loginCheckResult = loginCheckSession(req)
    if(loginCheckResult) {  // 有值，说明未登录
      return loginCheckResult
    }
    
    const id = req.query.id
    const result = updateBlog(id, req.body)
    return result.then(val => {
      if(val) {
        return new SuccessModel(val)
      } else {
        return new ErrorModel(val)
      }
    })
  }

  // 删除一篇博客
  if(method==='POST' && path==='/api/blog/del') {
    // 登录验证
    const loginCheckResult = loginCheckSession(req)
    if(loginCheckResult) {  // 有值，说明未登录
      return loginCheckResult
    }

    const id = req.query.id
    // const author = req.query.author
    const author = req.session.username  // 替换req.query.author
    let result = delBlog(id, author)
    return result.then(val => {
      if(val) {
        return new SuccessModel(val)
      } else {
        return new ErrorModel(val)
      }
    })
  }
}


module.exports = handleBlogRouter