const loginCheck = (username, password) => {
  if(username && password) {
    return true
  }
  return false
}


module.exports = {
  loginCheck
}