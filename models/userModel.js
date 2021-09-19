const mongoose = require('mongoose');
const validator = require('validator')
const Schema = mongoose.Schema;

const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

const UserSchema = new Schema(
  {
    _name: {
      type: String,
      required: true,
      maxLength: 64,
      trim: true,
      validate(value) {
        if (validator.contains(value, " ")) throw new Error('Username contains whitespace')
      }
    },
    _email: {
      type: String,
      required: true,
      maxLength: 254,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error('Invalid email');
      }
    },
    _password: {
      type: String,
      required: true,
      maxLength: 254,
      validate(value) {
        
      }
    },
    _posts: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
    },
    _date_of_creation: {
      type: Date
    },
  }
);

UserSchema.pre('save', function (next) {
  const user = this;
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