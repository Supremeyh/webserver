const express = require('express')
const router = express.Router()

router.get('/list', (req, res, next) => {
  res.json({
    errono: 0,
    data: [1, 2, 3]
  })
  // res.render('list', { title: 'list' })
})

module.exports = router