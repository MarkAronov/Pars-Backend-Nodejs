var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UsersSchema = new Schema(
  {
    name:               {type: String, required: true, maxLength: 128},
    id:                 {type: string, required: true, maxLength: 254},
    email:              {type: String, required: true, maxLength: 254},
    posts:              {type: [Posts]},
    date_of_creation:   {type: Date},
  }
);

// Virtual for username
UsersSchema.virtual('username').get(function () {
  return this.name
});

// Virtual for author's URL
UsersSchema.virtual('url').get(function () {
  return '/user/' + this.id;
});

//Export model
module.exports = mongoose.model('Users', UsersSchema);