class BaseModel {
  constructor(data, message) {
    // data是对象，message是字符串，并兼容不传data的情况
    if(typeof data === 'string') {
      this.message = data
      data = null
      message = null
    }

    if(data) {
      this.data = data
    }
    if(message) {
      this.message = message
    }
  }
}


class SuccessModel extends BaseModel {
  constructor(data, message) {
    super(data, message)
    this.errno = 0 
  }
}

class ErrorModel extends BaseModel {
  constructor(data, message) {
    super(data, message)
    this.errno = -1
  }
}


module.exports = {
  SuccessModel,
  ErrorModel
}