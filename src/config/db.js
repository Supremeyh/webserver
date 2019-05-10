const env = process.env.NODE_ENV

// 配置
let MYSQL_CONF = {}

if(env==='dev') {
  MYSQL_CONF = {
    host: 'localhost',
    user: 'root',
    password: 'sea123456',
    port: '3306',
    database: 'webserver'
  }
}

if(env==='production') {
  MYSQL_CONF = {
    host: 'localhost',
    user: 'root',
    password: 'sea123456',
    port: '3306',
    database: 'webserver'
  }
}


module.exports = {
  MYSQL_CONF
}