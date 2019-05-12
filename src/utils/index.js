const { ErrorModel } = require('../model/resModel')

// 设置cookie
const setCookieVal = (res, key, val) => {
  res.setHeader('Set-Cookie', `${key}=${val}; path=/; HttpOnly; expires=${setCookieExpire()}`)
} 

// 设置取cookie过期时间
const setCookieExpire = (n=1) => {
  const d = new Date()
  d.setTime(d.getTime() + (24 * 60 * 60 * 1000) * n)
  return d.toGMTString()
}

// 统一的登录验证函数
const loginCheckSession = (req) => {
  // session中没有username信息，则返回错误信息
  if(!req.session.username) {
    return Promise.resolve(new ErrorModel('未登录'))
  }
  // return undefined  // 这行可注释掉，即没有返回值，或返回undefined
}

module.exports = {
  setCookieVal,
  loginCheckSession
}