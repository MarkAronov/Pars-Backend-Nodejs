var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostSchema = new Schema(
  {
    _title: { type: String, required: true, maxLength: 254 },
    _content: { type: String, required: true },
    _poster: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    _children: { type: [{type: Schema.Types.ObjectId, ref: 'Post'}] },
    _id: { type: String, required: true, maxLength: 254 },
  }
);

// Virtual for post's URL
PostSchema.virtual('url').get(function () {
  return '/post/' + this._id;
});

//Export model
module.exports = mongoose.model('Post', PostSchema);