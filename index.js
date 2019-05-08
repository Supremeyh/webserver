const serverHandler = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const resData = {
    name: 'blog',
    site: 'myblog',
    env: process.env.NODE_ENV
  }

  res.end(JSON.stringify(resData))
}

module.exports = serverHandler