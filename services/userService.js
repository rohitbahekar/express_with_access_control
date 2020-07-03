const mongoose = require('mongoose')
const bcrypt= require('bcrypt')
const User = require('../models/UserModel')

const find = async (filter) => {
  const user = await User.findOne(filter)
  return user
}

const create = async (data) => {
  const hash = await bcrypt.hash(data.password, 10)
  const user = new User({...data, _id: new mongoose.Types.ObjectId(), password: hash })
  const createdUser = await user.save()
  createdUser.password = null
  return createdUser
}
const authenticate = async (filter, password) => {
  delete filter.password
  const user = await find(filter)
  if(user && bcrypt.compareSync(password, user.password)){
    user.password = null
    return user
  }else{
    return false
  }
}

module.exports = { find, create, authenticate }