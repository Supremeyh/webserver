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