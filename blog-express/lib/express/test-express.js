const express = require('./like-express')

const app = express()

app.use((req, res, next) => {
  console.log('开始')
  next()
})


app.use((req, res, next) => {
  console.log('cookie')
  req.cookie = {
    userId: 'abc'
  }
  next()
})

app.use('/api', (req, res, next) => {
  console.log('use api')
  next()
})

app.get('/api', (req, res, next) => {
  console.log('get api')
  next()
})

loginCheck = (req, res, next) => {
  setTimeout(() => {
    console.log('loginCheck')
    next()
  }, 1000);
}

app.get('/api/test', loginCheck, (req, res, next) => {
  console.log('get api test')
  res.json({
    errorno: 0,
    data: req.cookie
  })
})


app.listen(3001, () => {
  console.log('listening at http://localhost:3001')
})  