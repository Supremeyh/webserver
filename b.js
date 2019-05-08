const {add, mul} = require('./a')
const _ = require('lodash')

const sum = add(2, 3)
const res = mul(2, 3)

const arr = _.concat([1, 3], 5)

console.log(sum, res, arr)
