const mongoose = require('mongoose')
const Post = require('../models/PostModel')

const find = async (filter) => {
  const post = await Post.findOne(filter)
  return post
}

const create = async (data) => {
  const post = new Post({...data, _id: new mongoose.Types.ObjectId()})
  const createdPost = await post.save()
  return createdPost
}

const update = async (filter, data) => {
  const post = await Post.findOneAndUpdate(filter, {$set:data},  {
    new: true
  })
  return post
}

const read = async (filter) => {
  const posts = await Post.find(filter)
  return posts
}

const remove = async (filter) => {
  const posts = await Post.deleteOne(filter)
  return posts
}

module.exports = { find, create, update, read, remove }