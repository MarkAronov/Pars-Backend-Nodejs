const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

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
);

//Export model
const Post = mongoose.model('Post', PostSchema);
module.exports = Post