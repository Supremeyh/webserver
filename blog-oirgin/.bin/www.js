const http = require('http')

const PORT = 3000
const serverHandle = require('../index')

const server = http.createServer(serverHandle)
server.listen(PORT, () => {
  console.log('listening at http://localhost:3000')
  
})
