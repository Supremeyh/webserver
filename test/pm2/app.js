const http = require('http')

const server = http.createServer((req, res) => {
  // erorr
  if(req.url === '/err') {
    throw new Error('ooops !')
  }

  res.setHeader("Content-Type", "application/json")
  res.end(
    JSON.stringify({
      code: 2000,
      data: [2, 3, 5]
    })
  )
})

server.listen(3000, () => {
  console.log('listening at port 3000')
  
})