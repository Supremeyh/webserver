const { execSql, escape } = require('../db/mysql')
const { generatePassword} = require('../utils/crypto')

const loginCheck = async (username, password) => {
  // 密码加密
  password = generatePassword(password)

  // 使用mysql的escape函数 防止sql注入
  username = escape(username)
  password = escape(password)

  let sql = `select * from users where username=${username} and password=${password};`
  const arr = await execSql(sql)
  return arr[0] || {}
}


module.exports = {
  loginCheck
}