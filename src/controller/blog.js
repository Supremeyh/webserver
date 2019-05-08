const getList = (author, keyword) => {
  // mock
  return [
    {
      id: 1,
      title: '标题',
      content: '内容',
      createTime: '1557301478749',
      author: 'a'
    },
    {
      id: 2,
      title: '标题',
      content: '内容',
      createTime: '1557301478791',
      author: 'b'
    }
  ]
}

const getDetail = (id) => {
  return {
    id: 2,
    title: '标题',
    content: '内容',
    createTime: '1557301478791',
    author: 'b'
  }
}

const newBlog = (blogData={}) => {
  return {
    id: 3
  }
}

const updateBlog = (id, data) => {
  return true
}

const delBlog = (id) => {
  return true
}

module.exports = {
  getList,
  getDetail,
  newBlog,
  updateBlog,
  delBlog
}