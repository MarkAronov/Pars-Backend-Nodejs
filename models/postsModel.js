const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema

const PostSchema = new Schema(
  {
    _title: {
      type: String,
      required: true,
      maxLength: 254,
      trim: true,
    },
    _content: {
      type: String,
      required: true,
      trim: true,
    },
    _user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    _parents: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }]
    },
    _children: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }]
    },
    _date_of_creation: {
      type: Date,
      required: true,
      default: new Date(),
    },
    _edited: {
      type: Boolean,
      required: true,
    }
  }
)

PostSchema.methods.deleteRelations = async function () {
  const post = this
  for (let i = 0; i < post._parents.length; i++) {
    let parentId = post._parents[i]._id
    const formerParent = await Post.findById(parentId)
    if (formerParent) {
      formerParent._children.splice(formerParent._children.indexOf(post._id), 1)
      await formerParent.save()
    }
  }
  for (let i = 0; i < post._children.length; i++) {
    let childId = post._children[i]._id
    const formerChild = await Post.findById(childId)
    if (formerChild) {
      formerChild._parents.splice(formerChild._parents.indexOf(post._id), 1)
      await formerChild.save()
    }
  }
}

//Export model
const Post = mongoose.model('Post', PostSchema)
module.exports = Post