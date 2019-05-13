const fs = require('fs')
const path = require('path')


function createWriteStream (fileName) {
  const fullName =  getFullName(fileName)
  const writeStream = fs.createWriteStream(fullName, {
    flags: 'a'
  })
  return writeStream
}

function writeLog(writeStream, log) {
  writeStream.write(log + '\n')
}


// 获取完整文件路径名
function getFullName(fileName) {
  const fullName = path.join(__dirname, '../', 'logs', fileName)  
  return fullName
}


const accessWriteStream = createWriteStream('access.log')
const eventWriteStream = createWriteStream('event.log')
const errorWriteStream = createWriteStream('error.log')


function writeAccessLog(log) {
  writeLog(accessWriteStream, log)
}
function writeEventLog(log) {
  writeLog(eventWriteStream, log)
}
function writeErrorLog(log) {
  writeLog(errorWriteStream, log)
}

module.exports = {
  writeAccessLog,
  writeEventLog,
  writeErrorLog
}