import multer from 'multer';
import crypto from 'crypto';

// / MULTER SETTINGS ///
const megabyte = 1000000;

const userMediaTypes = [
  { name: 'avatar', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
];

const userMediaUpload = multer({
  limits: {
    fileSize: 10 * megabyte,
    files: 1,
  },
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./media/${file.fieldname}s`);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const fileExtension = file.originalname.substr(
        file.originalname.lastIndexOf('.') + 1
      );
      cb(
        null,
        file.fieldname +
          '-' +
          req.user._id +
          '-' +
          Date.now() +
          '-' +
          uniqueSuffix +
          '.' +
          fileExtension
      );
    },
  }),
  // ,
  // fileFilter(req, file, callback) {
  //   console.log(file);
  //   if (!file.originalname.match(/\.(jpg|png|gif)$/)) {
  //     return callback(
  //       new Error('The only formats allowed are PNG, JPG and GIF')
  //     );
  //   }
  //   callback(undefined, true);
  // },
});

export const userMulter = userMediaUpload.fields(userMediaTypes);
