// process.env.NODE_ENV
const quertstring = require('querystring')

const handleUserRouter = require('./src/router/user')
const handleBlogRouter = require('./src/router/blog')

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
  
  // 解析cookie
  req.cookie = {}
  const cookieStr = req.headers.cookie || ''
  cookieStr.split(';').forEach(item => {
    if(!item) return
    const arr = item.split('=')
    const key = arr[0]
    const val = arr[1]
    req.cookie[key] = val
  })
  

  // 处理 post data
  getPostData(req).then(postData => {
    req.body = postData    
    // 处理blog路由
    // const blogData = handleBlogRouter(req, res)
    // if(blogData) {
    //   res.end(
    //     JSON.stringify(blogData)
    //   )
    //   return
    // }
    const blogResult = handleBlogRouter(req, res)    
    if(blogResult) {
      blogResult.then(blogData => {
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