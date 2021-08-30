var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
  _name: { type: String, required: true, maxLength: 64, },
  _id: { type: String, required: true, maxLength: 254, },
  _email: { type: String, required: true, maxLength: 254 },
  _password: { type: String, required: true, maxLength: 254 },
  _posts: { type: [{ type: Schema.Types.ObjectId, ref: 'Post' }] },
  _date_of_creation: { type: Date },
});

// Virtual for username
UserSchema.virtual('username').get(function () {
  return this._name
});

// Virtual for user's URL
UserSchema.virtual('url').get(function () {
  return '/user/' + this._id;
});

UserSchema.pre('save', function (next) {
  var user = this;
  // only hash the password if it has been modified (or is new)
  if (!user.isModified('_password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(user._password, salt, function (err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user._password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = (candidatePassword, cb) => {
  bcrypt.compare(candidatePassword, this._password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  })
};
//Export model
module.exports = mongoose.model('User', UserSchema);