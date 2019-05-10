const { execSql } = require('../db/mysql')

const loginCheck = (username, password) => {
  let sql = `select * from users where username='${username}' and password='${password}';`
  return execSql(sql).then(arr => {
    return arr[0] || {}
  })
}


module.exports = {
  loginCheck
}