const { execSql } = require('../db/mysql')
const xss = require('xss')

const getList = async (author, keyword) => {
  let sql = `select * from blogs where 1=1 `
  if(author) {
    sql += `and author='${author}' `
  }
  if(keyword) {
    sql += `and title like '%${keyword}%' `
  }
  sql += `order by createtime desc;`  
  return await execSql(sql)
}

const getDetail = async (id) => {
  let sql = `select * from blogs where id='${id}';`
  const rows = await execSql(sql)
  return rows[0] || {}
}

const newBlog = async (blogData={}) => {
  const { title, content, author, createtime } = blogData
  // 防止xss攻击
  title = xss(title)
  content = xss(content)

  let sql = `insert into blogs (title, content, author, createtime) values ('${title}', '${content}', '${author}', '${createtime}');`
  const insertData = await execSql(sql)
  return {
    id: insertData.insertId
  }
}

const updateBlog = async (id, blogData) => {
  const { title, content, createtime } = blogData
  let sql = `update blogs set title='${title}', content='${content}', createtime='${createtime}' where id='${id}';`
  const updateData = await execSql(sql)
  if(updateData.affectedRows > 0) {
    return true
  }
  return false
}

const delBlog = async (id, author) => {
  let sql = `delete from blogs where id='${id}' and author='${author}';`
  const result = await execSql(sql)
  if(result.affectedRows > 0) {
    return true
  }
  return false
}

module.exports = {
  getList,
  getDetail,
  newBlog,
  updateBlog,
  delBlog
}