// 设置取cookie过期时间
const setCookieExpire = () => {
  const d = new Date()
  d.setTime(d.getTime() + (24 * 60 * 60 * 1000))
  return d.toGMTString()
}

module.exports = {
  setCookieExpire
}