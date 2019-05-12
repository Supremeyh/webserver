// process.env.NODE_ENV
const quertstring = require('querystring')

const handleUserRouter = require('./src/router/user')
const handleBlogRouter = require('./src/router/blog')

const { setCookieVal } = require('./src/utils')
const { setRedisVal, getRedisVal } = require('./src/db/redis')


const serverHandler = (req, res) => {
  // 设置返回数据格式 JSON
  res.setHeader('Content-Type', 'application/json')

  // 获取path 路由
  const url = req.url
  req.path = url.split('?')[0]

  // 解析query
  req.query = quertstring.parse(url.split('?')[1])
  
  // 解析cookie  处理成键值对 存入req.cookie中
  const cookie = parseCookie(req)
  req.cookie = cookie

  // 解析 session
  let needSetCookie = false
  let userId = req.cookie.userid
  if(!userId) {
    needSetCookie = true
    userId = `${Date.now()}_${Math.random()}`
  }

  // 将 sessionId 设置为 userId，后面的登录路由处理会用到
  req.sessionId = userId

  // 通过 userId 获取存储在 redis 中的数据
  getRedisVal(req.sessionId)
    .then(sessionData => {
      if(sessionData===null) {
        // 当对应的 sessionId 在 redis 中没有值的时，在 redis 中将其值设置为空对象
        setRedisVal(req.sessionId, {})
        req.session = {}
      } else {
        req.session = sessionData
      }
      return getPostData(req)
    })
    .then(postData => {
      req.body = postData    
      // 处理blog路由
      const blogResult = handleBlogRouter(req, res)    
      if(blogResult) {
        blogResult.then(blogData => {
          if(needSetCookie) {
            setCookieVal(res, 'userid', userId)
          }
          res.end(
            JSON.stringify(blogData)
          )
        })
        return
      }

      // 处理user路由
      const userResult = handleUserRouter(req, res)
      if(userResult) {
        userResult.then(userData => {
          if(needSetCookie) {
            setCookieVal(res, 'userid', userId)
          }
          if(userData) {
            res.end(
              JSON.stringify(userData)
            )
          }
        })
        return
      }

      // 未命中 404
      res.writeHead(404, {'Content-Type': 'text/plain'})
      res.write('404 Not Found')
      res.end()
  })

}


// 处理 post data
const getPostData = (req) => {  
  return new Promise((resolve, reject) => {
    if(req.method !== 'POST') {
      resolve({})
    }
    if(req.headers['content-type'] !== 'application/json') {
      resolve({})
    }

    let postData = ''
    req.on('data', chunk => {
      postData += chunk.toString()
    })
    
    req.on('end', () => {
      if(!postData) {
        resolve({})
        return
      }      
      resolve(JSON.parse(postData))      
    })
  })
}

// 解析cookie  处理成键值对 存入req.cookie中
const parseCookie = (req) => {
  let cookie = {}
  const cookieStr = req.headers.cookie || ''
  cookieStr.split(';').forEach(item => {
    if(!item) return
    const arr = item.split('=')
    const key = arr[0].trim()
    const val = arr[1].trim()
    cookie[key] = val
  })
  return cookie
}

module.exports = serverHandler