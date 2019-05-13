> create by sea, 2019.5.7

## Node.js从零开发Web Server博客项目

### nodejs 介绍
#### 下载和安装
* 普通方式
访问官网 https://nodejs.org/en/ ，下载并安装, 命令行运行 
node -v  查看当前node版本  显示结果则安装成功
* nvm node版本管理工具 (macOS)
安装HomeBrew 
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
安装nvm
brew install nvm
查看当前所有node版本
nvm list 
nvm install node 安装最新版本
nvm install v10.15.3 安装指定版本
nvm use v10.13.0 切换到指定版本
nvm use --delete-prefix v10.15.3  切换到指定版本

#### nodejs和js的区别
ECMAScipt， 语法规范，定义了语法和词法
javascript， 使用了ECMAScipt语法规范，以及Web API(w3c标准)
nodejs， 使用了ECMAScipt语法规范，以及nodejs API

#### CommonJs 模块化
```JavaScript
// a.js
function add(a, b) {
  return a + b
}

function mul(a, b) {
  return a * b
}

module.exports = {
  add,
  mul
}


// b.js
const {add, mul} = require('./a')

const sum = add(2, 3)
const res = mul(2, 3)

console.log(sum, res)
```

#### debugger
npm init -y  初始化package.json
需指定package.json 对应 "main": "index.js"

#### server端和前端的区别, 切换思路
服务稳定性，使用PM2做进程守候
考虑内存和CPU (优化、扩展)， server端要承载很多请求，内存和CPU 都是稀缺资源。stream 写日志，使用redis 存session
日志记录, 记录、存储、分析日志，否则是盲人摸象
安全，如越权操作、数据库攻击、xss攻击
集群和服务拆分


### 项目需求分析 和 技术方案
目标: 开发一个博客系统，具有博客的基本功能
需求：首页、作者主页、博客详情页；登录页；管理中心、新建页、编辑页

技术方案: 
数据如何存储(博客、用户)，数据库表设计
接口设计，如何与前端对接
登录，业界有统一的解决方案，一般不用再重新设计


### 开发博客项目之接口
####  http 概述
浏览器发送http请求过程: DNS解析(浏览器自身的DNS缓存且未过期、操作系统自身的DNS缓存且未过期、hosts文件、首选DNS服务器 运营商DNS、根域名服务器、顶级域名服务器 、域名注册商服务器) --> 发起TCP的3次握手 --> 建立TCP连接后发起http请求(报文格式为请求行、请求头部、请求包体) --> 服务器响应http请求，浏览器得到html代码 --> 浏览器解析html代码，并请求html代码中的资源 --> 浏览器对页面进行渲染呈现给用户

#### 处理http请求
```JavaScript
const http = require('http')
const querystring = require('querystring')

const server = http.createServer((req, res) => {
  const url = req.url

  // get请求与querystring
  if(req.method==='GET') {
    const path = url.split('?')[0]
    console.log(path) // 返回路由

    req.query = querystring.parse(url.split('?')[1])

    // 设置返回格式为JSON
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(req.query))
  }

  // post请求与post data 
  if(req.method==='POST') {
    let postData = ''
    req.on('data', chunk => {
      postData += chunk.toString()
    })

    req.on('end', () => {
      console.log(postData)
      res.end('hello node')
    })
  }

})

server.listen(3000, () => {
  console.log('listening at http://localhost:3000')
})
```

#### 搭建开发环境
使用nodemon检测文件变化，自动重启node
使用cross-env 设置环境变量，兼容mac linux 和windows, 需先使用 npm i --save-dev cross-env 命令安装cross-env 


#### 开发接口，处理路由
初始化路由: 根据技术方案的设计，做出路由
返回假数据: 将路由和数据分离，以符合设计原则，使用 postman 处理http请求
结构层次: 划分为三层: www启动服务及基本配置、index分配路由、router处理路由、 controller接口调用获取结果、model格式化返回结果

启动服务，基本配置
```JavaScript
// /.bin/www.js
const http = require('http')

const PORT = 3000
const serverHandle = require('../index')

const server = http.createServer(serverHandle)
server.listen(PORT, () => {
  console.log('listening at http://localhost:3000')
})
```

分配路由
```JavaScript
// /index.js  
const quertstring = require('querystring')

const handleUserRouter = require('./src/router/user')
const handleBlogRouter = require('./src/router/blog')

// 处理 post body data
const getPostBodyData = (req) => {  
  return new Promise((resolve, reject) => {
    if(req.method !== 'POST') {
      resolve({})
    }
    if(!req.headers['content-type'].includes('application/json')) { 
    // 实际上req.headers['content-type'] 为 'application/json;charset=UTF-8'
      resolve({})
    }

    let postData = ''
    req.on('data', chunk => {
      postData += chunk.toString()
    })
    
    req.on('end', () => {
      if(!postData) {
        resolve({})
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

  // 处理 post body data
  getPostBodyData(req).then(postData => {
    req.body = postData    
    // 处理blog路由
    const blogData = handleBlogRouter(req, res)

    if(blogData) {
      res.end(
        JSON.stringify(blogData)
      )
      return
    }

    // 处理user路由
    const userData = handleUserRouter(req, res)
    if(userData) {
      res.end(
        JSON.stringify(userData)
      )
      return
    }

    // 未命中 404
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.write('404 Not Found')
    res.end()
  })

}

module.exports = serverHandler
```

处理路由，router/blog.js 和 router/user.js 分别处理blog和user相关路由
```JavaScript
// 如 router/user.js 
const handleUserRouter = (req, res) => {
  const { method, url, path } = req

  // 登录
  if(method==='POST' && path==='/api/user/login') {
    return {
      msg: '登录'
    }
  }
}

module.exports = handleUserRouter
```

格式化返回结果
```JavaScript
// model/resModel
class BaseModel {
  constructor(data, message) {
    // data是对象，message是字符串，并兼容不传data的情况
    if(typeof data === 'string') {
      this.message = data
      data = null
      message = null
    }

    if(data) {
      this.data = data
    }
    if(message) {
      this.message = message
    }
  }
}


class SuccessModel extends BaseModel {
  constructor(data, message) {
    super(data, message)
    this.errno = 0 
  }
}

class ErrorModel extends BaseModel {
  constructor(data, message) {
    super(data, message)
    this.errno = -1
  }
}


module.exports = {
  SuccessModel,
  ErrorModel
}
```

### MySql 数据存储
#### 安装
MySql 是web server中最流行的关系型数据库
官网下载安装MySql、mysql workbench 操作sql 的可视化客户端，或者使用Navicat

#### 操作数据库
* 建库
create schema 'myblog';  创建myblog 的数据库
show databases; 查询是否成功
* 建表
新建 users 和 blogs两个表
```JavaScript
// column datatype pk主键 nn不为空 AI自动增加 Default 
users: id username password realname
CREATE TABLE  `myblg`, `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `password` VARCHAR(20) NOT NULL,
  `realname` VARCHAR(10) NOT NULL,
 PRIMARY KEY(`id`)
);

blogs: id title content createtime author
```
* 表操作
删改查
```JavaScript
use webserver;
-- show databases;

// 修改列属性 让id 自增, 或者选中fileds点击某列修改属性
alter table users change `id` `id` INT(10) NOT NULL AUTO_INCREMENT

// 增
insert into users (username, `password`, realname) values('zhangsan', '123', '张三');

// 查
select * from users;  // 所有列
select id, username from users  // 指定列名
select id, username from users where id='123' and username='zhangsan'; // 指定列名和条件
select id, username from users where username like '%zhang%'; // 模糊查询
select id, username from users where username like '%zhang%' order by id desc; // 排序 倒叙

// 改
update users set realname='张三', state=0 where username='lisi' limit 5

// 删
delete from users where username='lisi';
update users set state=0 where username='lisi'  // 实际项目中 更多修改表，新增state字段，通过修改状态标记是否可用，来软删除
```

#### nodejs操作数据库
npm i mysql --save
npm run dev 启动项目,这步需要安装cross-env, 使用命令npm i --save-dev cross-env

##### demo
```JavaScript
// myql-test/index.js  demo
const mysql = require('mysql')

// 创建连接对象
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sea123456',
  port: 3306,
  database: 'webserver'
})

// 开始连接
con.connect()

// 执行 sql 语句
const sql = `insert into users (username, realname, password, state) values('zl','赵六','123','1')`
con.query(sql, (err, result) => {
  if(err) {
    console.log(err)
    return
  }
  console.log(result)
  
})

// 关闭连接
con.end()
```

##### nodejs 连接 mysql 做成工具
在config/db.js 配置mysql, db/mysql.js 导出统一执行sql语句的函数 execSql。 这样就将mysql集成进项目，不再是上面的demo
```JavaScript
// config/db.js
const env = process.env.NODE_ENV

// 配置
let MYSQL_CONF = {}

if(env==='dev') {
  MYSQL_CONF = {
    host: 'localhost',
    user: 'root',
    password: 'sea123456',
    port: 3306,
    database: 'webserver'
  }
}

if(env==='production') {
  MYSQL_CONF = {//..}
}


module.exports = {
  MYSQL_CONF
}



// db/mysql.js
const mysql = require('mysql')
const { MYSQL_CONF } = require('../config/db')

// 创建连接对象
const con = mysql.createConnection(MYSQL_CONF)

// 开始连接
con.connect()

// 统一执行 sql 语句的函数
function execSql(sql) {
  return new Promise((resolve, reject) => {
    con.query(sql, (err, result) => {
      if(err) {
        reject(err)
      }
      resolve(result)
    })
  })
}

// 关闭连接  不需要关闭，单例模式
// con.end()

module.exports = {
  execSql
}
```

##### API对接mysql（博客列表）
替换假数据，controller改为mysql连接的真实数据, 并修改路由router 和 index.js 为异步promise。  以blog 的 getList 获取博客列表 为例
```JavaScript
// controller/blog.js
const getList = (author, keyword) => {
  let sql = `select * from blogs where 1=1 `
  if(author) {
    sql += `and author='${author}' `
  }
  if(keyword) {
    sql += `and title like '%${keyword}%' `
  }
  sql += `order by createtime desc;`
  let result = execSql(sql)
  return result
}


// router/blog.js
// 获取博客列表
if(method==='GET' && path==='/api/blog/list') {
  const author = req.query.author || ''
  const keyword = req.query.keyword || ''
  // const listData = getList(author, keyword)
  // return new SuccessModel(listData)
  const result = getList(author, keyword)
  return result.then(listData => {
    return new SuccessModel(listData)
  })
}

// index.js
getPostBodyData(req).then(postData => {
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
      return  // return 要写在这
    }
    // ..
}
```

### 登录校验、登录信息存储
#### cookie
HTTP Cookie是服务器发送到用户浏览器并保存在本地的一小块数据，它会在浏览器下次向同一服务器再发起请求时被携带并发送到服务器上。通常，它用于告知服务端两个请求是否来自同一浏览器，如保持用户的登录状态。Cookie使基于无状态的HTTP协议记录稳定的状态信息成为了可能。

主要用于: 会话状态管理（如用户登录状态、购物车）、个性化设置（如用户自定义设置、主题等）、浏览器行为跟踪（如跟踪分析用户行为等）

特点: 最大5kb、跨域不共享、格式如 k1=v1;k2=v2; 因此可以存储结构化数据

客户端操作cookie: document.cooke='k3=v3' 会累加到cookie中
server端操作cookie:   
```JavaScript
// index.js  解析cookie, 处理成键值对 存入req.cookie中
req.cookie = {}
const cookieStr = req.headers.cookie || ''
cookieStr.split(';').forEach(item => {
  if(!item) return
  const arr = item.split('=')
  const key = arr[0].trim()  // trim() 保证去除收尾空格
  const val = arr[1].trim()
  req.cookie[key] = val
})


// router/user.js
const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const result = loginCheck(username, password)
    return result.then(userData => {
      if(userData.username) {
        // 操作cookie  使用 HttpOnly 和 expires 限制前端获取改写和设置cookie及过期时间
        res.setHeader('Set-Cookie', `username=${userData.username}; path=/; HttpOnly; expires=${setCookieExpire()}`)
        return new SuccessModel(userData)
      }
      return new ErrorModel('登录失败')
    })
  }
}
```
####  session
cookie存储userid, server端的session存储用户信息
```JavaScript
// index.js
// session 数据
const SESSION_DATA = {}

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

// 处理 post body data
getPostBodyData(req).then(postData => {
  req.body = postData    
  // 处理blog路由
  const blogResult = handleBlogRouter(req, res)    
  if(blogResult) {
    blogResult.then(blogData => {
      // needSetCookie
      if(needSetCookie) {
        res.setHeader('Set-Cookie', `userid=${userId}; path=/; HttpOnly; expires=${setCookieExpire()}`)
      }
      res.end(
        JSON.stringify(blogData)
      )
    })
    return
  }
  // ...
}


// router/user.js
const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const result = loginCheck(username, password)
    return result.then(userData => {
      if(userData.username) {
        // 设置session
        req.session.username = userData.username
        
        // 操作cookie
        // res.setHeader('Set-Cookie', `username=${userData.username}; path=/; HttpOnly; expires=${setCookieExpire()}`)
        return new SuccessModel(userData)
      }
      return new ErrorModel('登录失败')
    })
  }
  // ...
}
```

#### session 写入redis
##### redis
Remote Dictionary Server是一个由Salvatore Sanfilippo写的key-value存储系统。
Redis是一个开源的使用ANSI C语言编写、遵守BSD协议、支持网络、可基于内存亦可持久化的日志型、Key-Value数据库，并提供多种语言的API。
它通常被称为数据结构服务器，因为值（value）可以是 字符串(String), 哈希(Hash), 列表(list), 集合(sets) 和 有序集合(sorted sets)等类型。

##### 为何将session 写入redis
问题：目前session是js变量，放在nodejs进程内存中。进程内存有限，访问量过大，可能内存暴增；正式线上运行是多进程，进程间无法共享。
方案：将web server和redis 拆分为两个单独的服务，双方都是独立可扩展的。
解释：redis是web server最常用的缓存数据库，数据存放在内存中，相比硬盘中的mysql，访问速度快快几个量级。但成本更高，可存储数据量更小，断电即消失。
原因: session访问频繁，对性能要求极高。session可忽略断电丢失数据的问题，重新获取即可。session相比mysql数据量不会太大。

##### redis 安装使用
安装：brew install redis
启动：redis-server、redis-cli  (6379是redis 服务端口)
设置：set myname sea  (在redis-cli中，下同)
获取： get myname
获取所有：keys *
删除： del myname

##### nodejs连接redis
redis-server 启动redis
npm i redis  安装redis依赖

```JavaScript
// redis-test demo
const redis = require('redis')

// 创建客户端
const redisClient = redis.createClient(6379, '127.0.0.1')

redisClient.on('error', err => {
  console.error(err)
})


redisClient.set('myname', 'sea', redis.print)
redisClient.get('myname', (err, val) => {
  if(err) {
    console.error(err)
    return
  }
  console.log('val', val)
  // 退出
  redisClient.quit()
})
```

##### nodejs连接redis 封装工具函数
```JavaScript
// config/db.js  配置redis常量
let REDIS_CONF = {}

if(env==='dev') {
  // redis
  REDIS_CONF = {
    host: '127.0.0.1',
    port: '6379',
  }
  // ...
}


// db/redis.js  封装成工具函数
const redis = require('redis')
const { REDIS_CONF } = require('../config/db')

// 创建redis客户端
const redisClient = redis.createClient(REDIS_CONF.port, REDIS_CONF.host)

// 监听error
redisClient.on('error', err => {
  console.error(err)
})

// 设置
function setRedisVal(key, val) {
  if(typeof val === 'object') {
    val = JSON.stringify(val)
  }
  redisClient.set(key, val, redis.print)
}

// 获取
function getRedisVal(key) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, val) => {
      if(err) {
        reject(err)
        return
      }
      if(val===null) {
        resolve(null)
        return
      }
      try {
        // 优先返回JSON 格式
        resolve(JSON.parse(val))
      } catch(e) {
        resolve(val)
      }
      // redisClient.quit()
    })
  })
}

module.exports = {
  setRedisVal,
  getRedisVal,
}
```
##### session登录验证 redis
```JavaScript
// index.js
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
      return getPostBodyData(req)
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
      // ...
  })
}


// utils/index.js 统一的登录验证函数
const loginCheckSession = (req) => {
  // session中没有username信息，则返回错误信息
  if(!req.session.username) {
    return  Promise.resolve(new ErrorModel('未登录'))
  }
  // return undefined  // 这行可注释掉，即没有返回值，或返回undefined
}


// router/blog.js
const { loginCheckSession } = require('../utils')

const handleBlogRouter = (req, res) => {
  const { method, url, path } = req

  // 登录验证  放在handleBlogRouter的顶部做成拦截器，保证所有后期请求都需先登录
  const loginCheckResult = loginCheckSession(req)
  if(loginCheckResult) {  // 有值，说明未登录
    return loginCheckResult
  }

  // 新建一篇博客  比如新建博客时，需要校验author，从session的username取出，保证登录的账号和author是同一个人，不会删除其他人的博客
  if(method==='POST' && path==='/api/blog/new') {
    const author = req.session.username
    req.body.author = author
    
    const blogData = req.body
    const dataResult = newBlog(blogData)
    return dataResult.then(data => {
      return new SuccessModel(data)
    })
  }
  // ...

}


// router/user.js
const { setRedisVal } = require('../db/redis')

const handleUserRouter = (req, res) => {
  const { method, url, path } = req
  // 登录
  if(method==='POST' && path==='/api/user/login') {
    const { username, password } = req.body
    const result = loginCheck(username, password)
    return result.then(userData => {
      if(userData.username) {
        // 设置session
        req.session.username = userData.username
        setRedisVal(req.sessionId, req.session)
        return new SuccessModel(userData)
      }
      return new ErrorModel('登录失败')
    })
  }
}
```
##### 前后端联调
登录功能依赖cookie，需要userid，必须要和浏览器联调
cookie跨域不共享，前后端必须同域，使用nginx 做代理，让前后端同域
开发前端网页

##### nginx 
高性能web服务器，开源免费。一般用于做静态服务、负载均衡、反向代理服务器。
下载:mac brew install nginx 
配置: /usr/local/etc/nginx/nginx.conf  (Mac) ，用vi 命令打开
测试配置文件是否正确: nginx -t
启动: nginx -s reload
停止: nginx -s stop
```JavaScript
// /usr/local/etc/nginx/nginx.conf
http {
  server {
    # 当访问 http://localhost:8080... 时生效
    listen        8080;
    server_name   localhost;
    
    # location / {
    #  root       html;
    #  index      index.html index.htm;
    # }

    # 静态文件 前端项目启动的端口
    location / {
      proxy_pass  http://localhost:8000;
      # 使用Nginx对WebSocket进行反向代理, 表示请求服务器升级协议为WebSocket
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
    }

    # server 后端项目启动的端口
    location /api/ {
      proxy_pass  http://localhost:3000;  
      proxy_set_header Host $host;
    }
  }

}
```
配置完成后，前端启动服务(如端口8000)，后端启动服务(端口3000)，浏览器访问 http://localhost:8080... 即可。


### 日志 
系统没有日志，就等于人没有眼睛
分类: 访问日志 access log、自定义日志(自定义事件、错误记录等)
nodejs文件操作，nodejs stream
日志拆分、内容分析

#### nodejs文件操作
```JavaScript
// file-test demo
// file-test/test.js
const fs = require('fs')
const path = require('path')

const fileName = path.resolve(__dirname, 'data.txt')  // file-test/data.txt

// 读
fs.readFile(fileName, (err, data) => {
  if(err) {
    console.error(err)
    return
  }
  // data是二进制数据  <Buffer 68 65 6c 6c 6f 20 0a 7a 7a 6c 61 70 61 0a 70 61 70 61 61 2d 2d 0a 7a 7a 7a 61>
  console.log(data.toString())
})

// 写
let content = 'new ...'
const opt = {
  flag: 'a',  // 追加a append, 覆盖w write
}

fs.writeFile(fileName, content, opt, (err) => {
  if(err) {
    console.error(err)
  }

})

// 判断文件是否存在
fs.exists(fileName, (exist) => {
  console.log('exist', exist)  // true
})
```
#### stream
IO操作(网络、文件)的性能瓶颈,突出特点就是慢
标准输入输出  process.stdin.pipe(process.stdout)
req.pipe(res) 类比成两个水桶，连接管道
```JavaScript
// file-test demo
// file-test/test.js
const fs = require('fs')
const path = require('path')

const fileName1 = path.resolve(__dirname, 'data.txt')
const fileName2 = path.resolve(__dirname, 'data-bak.txt')

const readStream = fs.createReadStream(fileName1)
const writeStream = fs.createWriteStream(fileName2)

readStream.pipe(writeStream)

readStream.on('data', chunk => {
  console.log(chunk.toString())
})

readStream.on('end', () => {
  console.log('ok')
})
```
#### 写日志
目录logs下，并新建 access.log、event.log、error.log 三个文件
```JavaScript
// utils/log.js  
const fs = require('fs')
const path = require('path')


function createWriteStream (fileName) {
  const fullName =  getFullName(fileName)
  const writeStream = fs.createWriteStream(fullName, {
    flags: 'a'
  })
  return writeStream
}

function writeLog(writeStream, log) {
  writeStream.write(log + '\n')
}


// 获取完整文件路径名
function getFullName(fileName) {
  const fullName = path.join(__dirname, '../', 'logs', fileName)  
  return fullName
}

// 访问日志
const accessWriteStream = createWriteStream('access.log')

function writeAccessLog(log) {
  writeLog(accessWriteStream, log)
}

module.exports = {
  writeAccessLog
}


// index.js
const { writeAccessLog } = require('./src/utils/log')

const serverHandler = (req, res) => {
  // 记录 access log 
  writeAccessLog(`${req.method}--${req.url}--${req.headers['user-agent']}--${Date.now()}`)
  // ...
}
```
之后，刷新页面，即可把请求写到日志

#### 日志拆分 crontab
日志慢慢积累，放在一个文件不好处理，一般按时间拆分日志，如2019-05-13.access.log
实现方式: linux的crontab命令，即定时任务
crontab设置定时任务，格式: `*****command` 分-时-日-月-星期几
流程：将access.log拷贝并重命名为2019-05-13.access.log，清空access.log文件，继续积累日志
创建utils/copy.sh脚本
```sh
#!/bin/sh
cd /Users/sea/Desktop/OnGoing/HelloWorld/FullStack/Node/webserver/src/logs
cp access.log $(date +%Y-%m-%d).access.log
echo "" > access.log
```
cli 执行 sh src/utils/copy.sh 即可实现将access.log日志拆分到 2019-05-13.access.log

cli 执行 crontab -e ，会打开编译器，输入
```Javascript
* 0 * * * sh /Users/sea/Desktop/OnGoing/HelloWorld/FullStack/Node/webserver/src/utils/copy.sh
```
wq保存，显示crontab:installing new crontab， 则完成每天凌晨0点0分 执行日志拆分脚本
crontab -l 查看当前任务列表

#### 日志分析 readline(
比如针对access.log 日志，分析使用chrome的占比
日志按行存储，一行就是一条日志
使用nodejs的readline(基于stream，效率高)
```Javascript
// utils/readline.js
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// 获取access.log 文件路径名
const fileName = path.join(__dirname, '../', 'logs', 'access.log')
// 创建 read stream
const readStream = fs.createReadStream(fileName)

// 创建readline对象
const rl = readline.createInterface({
  input: readStream
})

let total = 0
let chromeNum = 0

// 逐行读取
rl.on('line', lineData => {
  if(!lineData) return
  total++

  let arr = lineData.split('--')
  if(arr[2] && arr[2].includes('Chrome')) {
    chromeNum++
  }
})

// 监听读取完成
rl.on('close', () => {
  console.log('使用chrome占比 ' + chromeNum/total)
})
```

### 安全
#### xss攻击、sql注入
xss 攻击: 窃取前端的cookie

sql 注入: 窃取数据库内容
最原始、最简单的攻击，自从web2.0就有了sql注入攻击
方式:输入一个sql片段，最终拼接成一段攻击代码
预防: 使用mysql的escape函数处理输入内容即可
```JavaScript
// controller/user.js 
// 登录时账号密码输入如下（在mysql--表示注释）
select * from users where username='zhangsan';delete from users; -- 'and password='123';
```
上面代码发生sql注入。使用mysql的escape，并去掉变量的双引号
```JavaScript
// db/mysql.js
module.exports = {
  execSql,
  escape: mysql.escape
}

// controller/user.js
const { execSql, escape } = require('../db/mysql')
// 加上
username = escape(username)
password = escape(password)

// let sql = `select * from users where username='${username}' and password='${password}';`
let sql = `select * from users where username=${username} and password=${password};`  // 去掉变量的双引号
```


密码加密: 保证用户信息安全