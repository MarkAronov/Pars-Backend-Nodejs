var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostSchema = new Schema(
  {
    _title: { type: String, required: true, maxLength: 254 },
    _content: { type: String, required: true },
    _user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    _parents: { type: [{ type: Schema.Types.ObjectId, ref: 'Post' }] },
    _children: { type: [{ type: Schema.Types.ObjectId, ref: 'Post' }] },
    _id: { type: String, required: true, maxLength: 254 },
    _date_of_creation: { type: Date },
  }
);

// Virtual for post's URL
PostSchema.virtual('url').get(function () {
  return '/post/' + this._id;
});

//Export model
module.exports = mongoose.model('Post', PostSchema);