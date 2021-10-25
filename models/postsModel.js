const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 254,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parents: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }]
    },
    children: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }]
    },
    edited: {
      type: Boolean,
      required: true,
    }
  }
)

PostSchema.methods.deleteRelations = async function () {
  const post = this
  for (let i = 0; i < post.parents.length; i++) {
    let parentId = post.parents[i].id
    const formerParent = await Post.findById(parentId)
    if (formerParent) {
      formerParent.children.splice(formerParent.children.indexOf(post.id), 1)
      await formerParent.save()
    }
  }
  for (let i = 0; i < post.children.length; i++) {
    let childId = post.children[i].id
    const formerChild = await Post.findById(childId)
    if (formerChild) {
      formerChild.parents.splice(formerChild.parents.indexOf(post.id), 1)
      await formerChild.save()
    }
  }
}

//Export model
const Post = mongoose.model('Post', PostSchema)
module.exports = Post