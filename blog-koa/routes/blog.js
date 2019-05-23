const router = require('koa-router')()

// controller
const { getList, getDetail, newBlog, updateBlog, delBlog } = require('../controller/blog')

// model
const { SuccessModel, ErrorModel } = require('../model/resModel')

const loginCheckSession = require('../middleware/loginCheckSession')

router.prefix('/blog')

// 获取博客列表
router.get('/list', loginCheckSession, async (ctx, next) => {
  let author = ctx.query.author
  const keyword = ctx.query.keyword
  // 管理员界面
  if(ctx.query.isadmin) {
    if(ctx.session.username==null) {
      ctx.body = new ErrorModel('未登录')
      return
    }
    // 强制只查询登陆用户自己的博客
    author = ctx.session.username
  }

  const listData = await getList(author, keyword)
  ctx.body = new SuccessModel(listData)

})

// 获取博客详情
router.get('/detail', async (ctx, next) => {
  const id = ctx.query.id
  const detailData = await getDetail(id)
  ctx.body = new SuccessModel(detailData)
})

// 新建一篇博客
router.post('/new', loginCheckSession, async (ctx, next) => {
  const author = ctx.session.username  // 替换ctx.query.author
  ctx.request.body.author = author
  const blogData = ctx.body
  const data = await newBlog(blogData)
  ctx.body = new SuccessModel(data)
})

// 更新一篇博客
router.post('/update', loginCheckSession, async (ctx, next) => {
  const id = ctx.query.id
  const val = await updateBlog(id, ctx.request.body)
  if(val) {
    ctx.body = new SuccessModel(val)
  } else {
    ctx.body = new ErrorModel(val)
  }
})

// 删除一篇博客
router.post('/del', loginCheckSession, async (ctx, next) => {
  const id = ctx.query.id
  const author = ctx.session.username
  let val = await delBlog(id, author)
  if(val) {
    ctx.body = new SuccessModel(val)
  } else {
    ctx.body = new ErrorModel(val)
  }
})

module.exports = router