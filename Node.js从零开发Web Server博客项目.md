> create by sea, 2019.5.7

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
使用cross-env 设置环境变量，兼容mac linux 和windows

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
  req.query = quertstring.parse(url.split('?')[0])

  // 处理 post data
  getPostData(req).then(postData => {
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















