> create by sea, 2019.5.7

## Node.js从零开发Web Server博客项目

### 使用 express 重构博客项目
express 是nodejs最常用的web server框架， Fast, unopinionated, minimalist web framework for node.


#### 下载、安装
express-generator  使用脚手架
```JavaScript
npm i express-generator -g  // 全局安装脚手架
express blog-express  // 生成项目

npm i cross-env --save-dev // 安装cross-env

// 配置package.json (部分)
"scripts": {
  "start": "node ./bin/www",
  "dev": "cross-env NODE_ENV=development nodemon ./bin/www",
  "prod": "cross-env NODE_ENV=production nodemon ./bin/www"
},
"devDependencies": {
  "cross-env": "^5.2.0"
}

npm i  // 安装依赖
npm run dev // 启动项目
```

#### 开发接口
##### 初始化环境、路由
安装插件 mysql、xss
config、mysql、controller、model/resModel相关代码可以复用blog-origin原生开发代码，要保证相关资源的引入和路径修改

记得启动nginx、mysql 和 redis-server

##### 处理session
使用express-session和connect-redis，简单方便
req.session保存登录信息，登录校验做成express中间件

npm i express-session --save
```JavaScript
// app.js
var session = require('express-session')
var { SECRET_KEY } = require('./utils/crypto')

// session  在路由前面配置
app.use(session({
  secret: SECRET_KEY,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}))
```

##### 使用session登录
```JavaScript
// routes/login.js
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
      // 设置 session  会自动同步到redis
      req.session.username = userData.username
              
      // 同步到 redis  这步不需要了
      // setRedisVal(req.sessionId, req.session)

      // return new SuccessModel(userData, '登录成功')
      // 改成, 失败下同
      res.json(new SuccessModel(userData, '登录成功'))
      return
    }
    res.json(new ErrorModel('登录失败'))
  })

})

module.exports = router
```
其中，setRedisVal 不再需要,  设置 session时 会自动同步到redis。返回结果改成res.json() 在return的方式。
之后，使用postman，参数输入账号密码可测试登录接口， 如zhangsan, 123 返回登录成功。 或者，启动nginx 通过前端服务访问。

##### 连接redis, session存入redis
npm i redis connect-redis --save
```JavaScript
// db/redis.js  创建redisClient
const redis = require('redis')
const { REDIS_CONF } = require('../config/db')

// 创建redis客户端
const redisClient = redis.createClient(REDIS_CONF.port, REDIS_CONF.host)

// 监听error
redisClient.on('error', err => {
  console.error(err)
})

module.exports = redisClient


// app.js
var redisClient = require('./db/redis')
var redisStore = require('connect-redis')(session)

// session
const sessionStore = new redisStore({
  client: redisClient
})
app.use(session({
  secret: SECRET_KEY,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  },
  store: sessionStore  // 存入store
}))
```
这步要启动redis-server

查看redis: 启动redis-cli -> 先清空flushdb -> keys * 返回为空 -> "sess:W..y " ->  get sess:W..y 没有username->启动前端8081 -> nginx代理 8080登录 -> get sess:W..y 有username

##### 登录中间件
新建middleware/loginCheckSession.js 文件, loginCheckResult中间件，判定session中是否有username。 之后，在需要登录校验的接口调用中间件。
```JavaScript
// middleware/loginCheckSession   loginCheckResult中间件
const { ErrorModel } = require('../model/resModel')

const loginCheckSession = (req, res, next) => {
  if(req.session.username) {
    next()
    return
  }
  res.json(new ErrorModel('未登录'))
}

module.exports = loginCheckSession


// routes/blog.js  调用
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
  // ...

})
```

##### 开发路由，获取博客详情等
与以上登录类似，以获取博客详情为例, 更新、删除等类似
```JavaScript
// routes/blog.js
// 获取博客详情
router.get('/detail', (req, res, next) => {
  const id = req.query.id
  let detailResult = getDetail(id)
  return detailResult.then(detailData => {
    res.json(new SuccessModel(detailData))
  })
})
```

##### 记录日志
access log记录日志，直接使用脚手架推荐的morgan
```JavaScript
// app.js
var path = require('path')
var fs = require('fs')
var logger = require('morgan')


var ENV = process.env.NODE_ENV
if(ENV !=='production') {
  // 开发、测试环境
  app.use(logger('dev', {
    stream: process.stdout  // 打印到控制台  可省略
  }))
} else {
  // 线上环境
  const fileName = path.join(__dirname, 'logs', 'access.log')
  const writeStream = fs.createWriteStream(fileName, {
    flags: 'a'
  })
  app.use(logger('combined', {
    stream: writeStream
  }))
}
```

##### express 中间件原理
app.use() 注册中间件，先收集起来
遇到http请求，根据method和path判断触发哪些
实现next机制，即上一个通过next触发下一个

express实现原理
```JavaScript
// lib/like-express.js 
const http = require('http')
const slice = Array.prototype.slice

class LikeExpress {
  constructor() {
    // 存放中间件列表
    this.routes = {
      all: [],
      get: [],
      post: []
    }
  }

  register(path) {
    const info = {}
    if(typeof path === 'string') {
      info.path = path
      // 从第二个参数开始，转换为数组，存入stack
      info.stack = slice.call(arguments, 1)
    } else {
      info.path = '/'
      // 从第一个参数开始，转换为数组，存入stack
      info.stack = slice.call(arguments, 0)
    }
    return info
  }

  use() {
    const info = this.register.apply(this, arguments)
    this.routes.all.push(info)
  }

  get() {
    const info = this.register.apply(this, arguments)
    this.routes.get.push(info)
  }

  post() {
    const info = this.register.apply(this, arguments)
    this.routes.post.push(info)
  }

  match(method, url) {
    let stack = []
    if(url==='/favicon.ico') {
      return stack
    }
    // 获取routes
    let curRoutes = []
    curRoutes = curRoutes.concat(this.routes.all, this.routes[method])
    
    curRoutes.forEach(routeInfo => {
      if(url.indexOf(routeInfo.path) === 0) {
        // url==='/api/test' 且 routeInfo.path为 '/'、'/api' 或 '/api/test'
        stack = stack.concat(routeInfo.stack)
      }
    })
    return stack
  }

  // next 机制
  handle(req, res, stack) {
    // 定义next，并立即执行
    const next = () => {
      // 拿到第一个匹配的中间件
      const middleware = stack.shift()
      if(middleware) {
        // 执行中间件函数
        middleware(req, res, next)
      }
    }
    next()
  }

  callback() {
    return (req, res) => {
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      }
      const url = req.url
      const method = req.method.toLowerCase() // 这里必须 toLowerCase() 统一成小写
      const resultList = this.match(method, url)
      this.handle(req, res, resultList)
    }
  }

  listen(...args) {
    const server = http.createServer(this.callback())
    server.listen(...args)
  }
}


// 工场函数
module.exports = () => {
  return new LikeExpress()
}
```

测试代码, 测试自己实现的express 是否生效
```JavaScript
// lib/express/test-express
const express = require('./like-express')
const app = express()

app.use((req, res, next) => {
  console.log('开始')
  next()
})

app.use((req, res, next) => {
  console.log('cookie')
  req.cookie = {
    userId: 'abc'
  }
  next()
})

app.use('/api', (req, res, next) => {
  console.log('use api')
  next()
})

app.get('/api', (req, res, next) => {
  console.log('get api')
  next()
})

loginCheck = (req, res, next) => {
  setTimeout(() => {
    console.log('loginCheck')
    next()
  }, 1000);
}

app.get('/api/test', loginCheck, (req, res, next) => {
  console.log('get api test')
  res.json({
    errorno: 0,
    data: req.cookie
  })
})


app.listen(3001, () => {
  console.log('listening at http://localhost:3001')
})  
```
运行 node lib/express/test-express 访问页面，查看控制台输出


##### 小结
使用express框架与原生开发区别:
写法上发生改变，如req.query、req.json，可直接获取写入，不需要自己写入； 
存储session到redis 使用 express-session、connect-redis，登录中间件;
记录日志，使用morgan
express原理
