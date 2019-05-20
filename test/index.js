const fs = require('fs')
const path = require('path')

// callback
// function getFileContentByCb(fileName, cb) {
//   const fullFileName = path.resolve(__dirname, 'files', fileName)
//   fs.readFile(fullFileName, (err, data) => {
//     if(err) {
//       console.error(err)
//       return 
//     }
//     cb(JSON.parse(data.toString()))
//   })
// }

// test callback-hell
// getFileContentByCb('a.json', aData => {
//   console.log('a data', aData)
//   getFileContentByCb(aData.next, bData => {
//     console.log('b data', bData)
//     getFileContentByCb(bData.next, cData => {
//       console.log('c data', cData)
//     })
//   }) 
// })


// promise
function getFileContentByPromise(fileName) {
  const fullFileName = path.resolve(__dirname, 'files', fileName)
  return new Promise((resolve, reject) => {
    fs.readFile(fullFileName, (err, data) => {
      if(err) {
        reject(err)
        return
      }
      resolve(JSON.parse(data.toString()))
    })
  })
}

async function readFileData() {
  // async包裹函数体； await后跟promise对象，promise中resolve内容可以被await解析返回到前面的变量中
  const aData = await getFileContentByPromise('a.json')  
  console.log('a data', aData)
  const bData = await getFileContentByPromise(aData.next)
  console.log('b data', bData)
  const cData = await getFileContentByPromise(bData.next)
  console.log('c data', cData)
}

readFileData()
// getFileContentByPromise('a.json')
//   .then(aData => {
//     console.log('a data', aData)
//     return getFileContentByPromise(aData.next)
//   })
//   .then(bData => {
//     console.log('b data', bData)
//     return getFileContentByPromise(bData.next)
//   })
//   .then(cData => {
//     console.log('c data', cData)
//   })

