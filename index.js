// process.env.NODE_ENV
const quertstring = require('querystring')

const handleUserRouter = require('./src/router/user')
const handleBlogRouter = require('./src/router/blog')

const { setCookieExpire } = require('./src/utils')

// session 数据
const SESSION_DATA = {}

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

const serverHandler = (req, res) => {
  // 设置返回数据格式 JSON
  res.setHeader('Content-Type', 'application/json')

  // 获取path 路由
  const url = req.url
  req.path = url.split('?')[0]

  // 解析query
  req.query = quertstring.parse(url.split('?')[1])
  
  // 解析cookie  处理成键值对 存入req.cookie中
  req.cookie = {}
  const cookieStr = req.headers.cookie || ''
  cookieStr.split(';').forEach(item => {
    if(!item) return
    const arr = item.split('=')
    const key = arr[0].trim()
    const val = arr[1].trim()
    req.cookie[key] = val
  })

  // 解析 session
  let needSetCookie = false
  let userId = req.cookie.userid
  if(userId) {
    if(!SESSION_DATA[userId]) {
      SESSION_DATA[userId] = {}
    }
  } else {
    needSetCookie = true
    userId = `${Date.now()}_${Math.random()}`
    SESSION_DATA[userId] = {}
  }
  req.session = SESSION_DATA[userId]

  // 处理 post data
  getPostData(req).then(postData => {
    req.body = postData    
    // 处理blog路由
    const blogResult = handleBlogRouter(req, res)    
    if(blogResult) {
      blogResult.then(blogData => {
        if(needSetCookie) {
          res.setHeader('Set-Cookie', `userid=${userId}; path=/; HttpOnly; expires=${setCookieExpire()}`)
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
          res.setHeader('Set-Cookie', `userid=${userId}; path=/; HttpOnly; expires=${setCookieExpire()}`)
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

module.exports = serverHandler