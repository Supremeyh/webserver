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

