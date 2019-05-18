const redis = require('redis')
const { REDIS_CONF } = require('../config/db')

// 创建redis客户端
const redisClient = redis.createClient(REDIS_CONF.port, REDIS_CONF.host)

// 监听error
redisClient.on('error', err => {
  console.error(err)
})


module.exports = redisClient

