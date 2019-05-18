const crypto = require('crypto')

// 密钥
const SECRET_KEY = 'HELLO_Node@2019'

// md5 加密
function md5(content) {
  let md5 = crypto.createHash('md5')
  return md5.update(content).digest('hex')
}

// 加密函数
function generatePassword(password) {
  const str = `password=${password}&key=${SECRET_KEY}`
  return md5(str)
}


module.exports = {
  generatePassword,
  SECRET_KEY
}
