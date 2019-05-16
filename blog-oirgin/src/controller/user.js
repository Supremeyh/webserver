const { execSql, escape } = require('../db/mysql')
const { generatePassword} = require('../utils/crypto')

const loginCheck = (username, password) => {
  // 密码加密
  password = generatePassword(password)

  // 使用mysql的escape函数 防止sql注入
  username = escape(username)
  password = escape(password)

  let sql = `select * from users where username=${username} and password=${password};`
  console.log('sql', sql)
  
  return execSql(sql).then(arr => {
    return arr[0] || {}
  })
}


module.exports = {
  loginCheck
}