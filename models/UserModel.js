const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    default: 'user',
  },
})

module.exports = mongoose.model('User', UserSchema)