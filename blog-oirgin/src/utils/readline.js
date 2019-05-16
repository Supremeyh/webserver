const fs = require('fs')
const path = require('path')
const readline = require('readline')

// 获取access.log 文件路径名
const fileName = path.join(__dirname, '../', 'logs', 'access.log')
// 创建 read stream
const readStream = fs.createReadStream(fileName)

// 创建readline对象
const rl = readline.createInterface({
  input: readStream
})

let total = 0
let chromeNum = 0

// 逐行读取
rl.on('line', lineData => {
  if(!lineData) return
  total++
  
  let arr = lineData.split('--')
  if(arr[2] && arr[2].includes('Chrome')) {
    chromeNum++
  }
})

// 监听读取完成
rl.on('close', () => {
  console.log('使用chrome占比 ' + chromeNum/total)
})