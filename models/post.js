const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    _title: {
      type: String, required: true, maxLength: 254,
      validate(value) {
        if (value.length < 1) throw new Error('Post title can not be empty');
      }
    },
    _content: {
      type: String, required: true,
      validate(value) {
        if (value.length < 1) throw new Error('Post content can not be empty');
      }
    },
    _user: {
      type: Schema.Types.ObjectId, ref: 'User', required: true
    },
    _parents: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
    },
    _children: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
    },
    _date_of_creation: {
      type: Date
    },
  }
);

//Export model
module.exports = mongoose.model('Post', PostSchema);