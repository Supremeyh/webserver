> create by sea, 2019.5.7

## Node.js从零开发Web Server博客项目


### 使用 Koa2 重构博客项目
express 中间件是异步回调，koa2原生支持async/await
新开发框架都开始基于koa，例如egg.js
express 虽然未过时，但koa2肯定是未来趋势
注: node版本大于等于8.0

#### async/await 异步函数介绍
##### 异步方式对比
在/test/files下有a.json、b.json、c.json三个文件，分别用callback、promise 和 async/await三种方式实现异步获取
* callback-hell
```JavaScript
// /test/index.js
const fs = require('fs')
const path = require('path')

// callback
function getFileContentByCb(fileName, cb) {
  const fullFileName = path.resolve(__dirname, 'files', fileName)
  fs.readFile(fullFileName, (err, data) => {
    if(err) {
      console.error(err)
      return 
    }
    cb(JSON.parse(data.toString()))
  })
}

// test callback-hell
getFileContentByCb('a.json', aData => {
  console.log('a data', aData)
  getFileContentByCb(aData.next, bData => {
    console.log('b data', bData)
    getFileContentByCb(bData.next, cData => {
      console.log('c data', cData)
    })
  }) 
})

// 打印结果
// a data { msg: 'this is a', next: 'b.json' }
// b data { msg: 'this is b', next: 'c.json' }
// c data { msg: 'this is c', next: null }
```
* promise
```JavaScript
// /test/index.js
function getFileContentByPromise(fileName) {
  const fullFileName = path.resolve(__dirname, 'files', fileName)
  return new Promise((resolve, reject) => {
    fs.readFile(fullFileName, (err, data) => {
      if(err) {
        reject(err)
        return
      }
      resolve(JSON.parse(data.toString()))
    })
  })
}

// promise().then()
getFileContentByPromise('a.json')
  .then(aData => {
    console.log('a data', aData)
    return getFileContentByPromise(aData.next)
  })
  .then(bData => {
    console.log('b data', bData)
    return getFileContentByPromise(bData.next)
  })
  .then(cData => {
    console.log('c data', cData)
  })
```
* async/await 变成同步的写法
要点:
await包裹在async函数里面； 
await后可追加promise对象； 
async函数执行返回的也是一个promise对象；
promise中resolve内容可以被await解析返回到前面的变量中； 
try...catch 截获promise中reject的值
```JavaScript
// /test/index.js   
async function readFileData() {
  try {
    const aData = await getFileContentByPromise('a.json')  // 其中，getFileContentByPromise和promise一样。
    console.log('a data', aData)
    const bData = await getFileContentByPromise(aData.next)
    console.log('b data', bData)
    const cData = await getFileContentByPromise(bData.next)
    console.log('c data', cData)
  } catch(e) {
    console.error(e)
  }
}

readFileData()
```

#### koa介绍、安装、使用
Expressive middleware for node.js using ES2017 async functions
```JavaScript
npm i koa-generator -g  // 安装脚手架
Koa2 blog-koa  // 生成blog-koa 的项目
npm i cross-env --save-dev  // 安装 cross-env

// package.json  修改配置
"scripts": {
  "start": "node bin/www",
  "dev": "cross-env NODE_ENV=dev ./node_modules/.bin/nodemon bin/www",
  "prd": "cross-env NODE_ENV=production pm2 start bin/www",
},

npm i && npm run dev  // 安装依赖、启动项目

// http://localhost:3000/   // 打开浏览器访问默认3000端口
```

#### koa 路由
需要特别注意的是，之前的req.body 都需要改为 ctx.request.body 请求体，以区分ctx.body 返回体
```JavaScript
// app.js
const login = require('./routes/login')
// routes
app.use(login.routes(), login.allowedMethods())


// routes/login.js
const router = require('koa-router')()

router.prefix('/login')

router.post('/login', async (ctx, next) => {
  const { username, password } = ctx.request.body
  ctx.body = {
    code: 2000,
    username,
    password,
  }
})

module.exports = router
```
#### koa 中间件
app.use()注册中间件，使用async/await; next() 也是一个promise
```JavaScript
// app.js  以 logger 中间件为例
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
```
#### 实现登录 redis存储session
实现登录的session， 和express类似，基于koa-generic-session 和 koa-redis
npm i koa-generic-session redis koa-redis --save
```JavaScript
// app.js   配置session、redis
const session = require('koa-generic-session')
const redisStore = require('koa-redis')
const { REDIS_CONF } = require('./config/db')

// session  在logger和routes之间  
app.keys = ['HELLO_Node@2019']
app.use(session({
  // cookie
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  },
  // redis
  store: redisStore({
    // all: '127.0.0.1:6379'  // 写死
    all: `${REDIS_CONF.host}:${REDIS_CONF.port}` // 配置store中all为 REDIS_CONF 配置的参数
  })
}))


// routes/login.js   测试
router.get('/test', async(ctx, next) => {
  if(ctx.session.viewNum==null) {
    ctx.session.viewNum = 0
  }
  ctx.session.viewNum++ 

  ctx.body = {
    code: 2000,
    viewNum: ctx.session.viewNum
  }
})
```
启动redis-server， 浏览器访问 http://localhost:3000/login/test  测试; 或者 redis-cli -> keys*  -> get ...  方式来测试

#### 开发路由
##### 准备工作
npm i mysql xss --save  安装 mysql、xss 依赖

复用blog-express之前代码，如登录中间件 config、db/mysql.js、controller、utils、middleware、model 等文件夹或文件 到blog-koa项目，对其中一些文件进行修改，中间件要符合koa中间件形式

修改controller 为 async/await 函数。 此处举getDetail、newBlog两个例子，可对比promise 和 async/await 的用法区别，写法清晰很多
```JavaScript
// controller/blog.js  以getDetail函数为例
const getDetail = (id) => {
  let sql = `select * from blogs where id='${id}';`
  return execSql(sql).then(arr => {
    return arr[0]
  })
}
// 修改为
const getDetail = async (id) => {
  let sql = `select * from blogs where id='${id}';`
  const rows = await execSql(sql)
  return rows[0]
}


// controller/blog.js  再以newBlog函数为例
const newBlog = async (blogData={}) => {
  // ...
  return execSql(sql).then(insertData => {
    return {
      id: insertData.insertId
    }
  })
}
// 修改为
const newBlog = async (blogData={}) => {
  // ...
  const insertData = await execSql(sql)
  return {
    id: insertData.insertId
  }
}
```
修改 middleware/loginCheckSession.js  改promise方式为koa方式。 这个是比较标准的koa中间件。
```JavaScript
// middleware/loginCheckSession.js 
const { ErrorModel } = require('../model/resModel')

const loginCheckSession = (req, res, next) => {
  if(req.session.username) {
    next()
    return
  }
  res.json(new ErrorModel('未登录'))
}

module.exports = loginCheckSession

// 修改为
const { ErrorModel } = require('../model/resModel')

const loginCheckSession = async (rctx, next) => {
  if(ctx.session.username) {
    await next()
    return
  }
  ctx.body = new ErrorModel('未登录')
}

module.exports = loginCheckSession
```
##### 初始化路由，开发接口
开发routes/login.js和routes/blog.js路由，这步也可以复用之前blog-express中routes下的代码，对其进行改造koa的async/await形式。以routes/blog.js 中获取博客详情为例，
```JavaScript
// routes/blog.js
// controller  这几行可直接复用
const { getList, getDetail, newBlog, updateBlog, delBlog } = require('../controller/blog')
// model
const { SuccessModel, ErrorModel } = require('../model/resModel')
const loginCheckSession = require('../middleware/loginCheckSession')

// 以下需改造
router.get('/detail', (req, res, next) => {
  const id = req.query.id
  let detailResult = getDetail(id)
  return detailResult.then(detailData => {
    res.json(new SuccessModel(detailData))
  })
})
// 替换为
router.get('/detail', async (ctx, next) => {
  const id = ctx.query.id
  const detailData = await getDetail(id)
  ctx.body = new SuccessModel(detailData)
})
```
##### 联调测试，连接数据库，启动nginx、前端项目
前端页面访问请求，或者使用postman模拟

#### 日志记录、拆分与分析
access log 记录，使用morgan, 新建logs/access.log文件
koa框架中koa-logger仅仅使得日志打印格式化，并未真正记录日志，需借助koa-morgan, 因morgan只适用于express
自定义日志暂时使用console.log/error

npm i koa-morgan --save  安装依赖 koa-morgan
```JavaScript
// app.js
const path = require('path')
const fs = require('fs')
const morgan = require('koa-morgan')

// logs  可写在logger之后。类似于express,但需app.use(logger('dev'))改为app.use(morgan('dev')),因logger已被占用
const ENV = process.env.NODE_ENV
if(ENV !=='production') {
  // 开发、测试环境
  app.use(morgan('dev'));
} else {  
  // 线上环境
  const fileName = path.join(__dirname, 'logs', 'access.log')
  const writeStream = fs.createWriteStream(fileName, {
    flags: 'a'
  })
  app.use(morgan('combined', {
    stream: writeStream
  }));
}
```

#### koa2中间件原理
##### koa2官方实例
洋葱圈模型: request -> onion-1 start -> onion-2 start -> onion-2 end -> onion-1 end -> response
```JavaScript
// blog-koa/lib/test-koa.js   nodemon test-koa.js 启动
const Koa = require('koa');
const app = new Koa();

// logger
app.use(async (ctx, next) => {
  console.log('onion-1 ', 'start')
  
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);

  console.log('onion-1 ', 'end')
});

// x-response-time
app.use(async (ctx, next) => {
  console.log('onion-2 ', 'start')

  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);

  console.log('onion-2 ', 'end')
});

// response
app.use(async ctx => {
  console.log('onion-3 ', 'start')

  ctx.body = 'Hello World';

  console.log('onion-3 ', 'end')
});

app.listen(3000);
```
##### 原理分析
app.use 注册中间件，先收集起来
实现next机制，即上一个通过next触发下一个
不涉及method和path判断

##### 核心代码
```JavaScript
// lib/like-koa.js
const http = require('http')

// 组合中间件
function compose(middlewareList) {
  return function(ctx) {
    // 中间件调用
    function dispatch(i) {
      const fn = middlewareList[i]
      // 兼容未使用async，保证返回的中间件都是promise
      try {
        return Promise.resolve(
          fn(ctx, dispatch.bind(null, i+1))  // next机制
        )
      } catch (e) {
        Promise.reject(e)
      }
    }
    return dispatch(0)
  }
}

class LikeKoa {
  constructor() {
    this.middlewareList = []
  }

  use(fn) {
    this.middlewareList.push(fn)
    return this  // 链式调用
  }

  listen(...args) {
    const server = http.createServer(this.callback())
    server.listen(...args)
  }

  callback() {
    const fn = compose(this.middlewareList)

    return (req, res) => {
      const ctx = this.createContext(req, res)
      return this.handleRequest(ctx, fn)
    }
  }

  // 拼接ctx
  createContext(req, res) {
    const ctx = {
      req, 
      res
    }
    ctx.query = req.query
    return ctx
  }

  handleRequest(ctx, fn) {
    return fn(ctx)
  }
}

module.exports = LikeKoa
```
##### 测试代码
仿照官网示例demo实现的lib/test-koa.js，修改koa引用like-koa，ctx涉及method、url、body、set、get等处
```JavaScript
// lib/test-like-koa.js
const Koa = require('./like-koa'); // 替换node_modules/koa
const app = new Koa();

// logger
app.use(async (ctx, next) => {
  console.log('onion-1 ', 'start')
  await next();
  const rt = ctx['X-Response-Time'];  // 替换ctx.get
  console.log(`${ctx.req.method} ${ctx.req.url} - ${rt}`);  // 替换ctx.method/url
  console.log('onion-1 ', 'end')
});

// x-response-time
app.use(async (ctx, next) => {
  console.log('onion-2 ', 'start')
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx['X-Response-Time'] = `${ms}ms`;  // 替换ctx.set
  console.log('onion-2 ', 'end')
});

// response
app.use(async ctx => {
  console.log('onion-3 ', 'start')
  ctx.res.end('Hello from like-koa!');  // 替换ctx.body
  console.log('onion-3 ', 'end')
});

app.listen(3000);
```