const http = require('http')

const PORT = 3000
const serverHandle = require('../index')

const server = http.createServer(serverHandle)
server.listen(PORT)
