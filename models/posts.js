var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Posts = new Schema(
  {
    title:      {type: String, required: true, maxLength: 254},
    content:    {type: String, required: true},
    author:     {type: Schema.Types.ObjectId, ref: 'Users', required: true},
    children:   {type: [Posts]},
  }
);

// Virtual for post's URL
Posts.virtual('url').get(function () {
  return '/post/' + this.id;
});

//Export model
module.exports = mongoose.model('Posts', PostsSchema);