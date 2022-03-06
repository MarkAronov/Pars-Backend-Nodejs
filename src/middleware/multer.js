import multer from 'multer';
import crypto from 'crypto';
// import { fileTypeFromFile } from 'file-type';

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
    destination: async (req, file, cb) => {
      cb(null, `./media/${file.fieldname}s`);
    },
    filename: async (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      cb(null, file.fieldname + '-' + Date.now() + '-' + uniqueSuffix);
    },
  }),
  // fileFilter(req, file, callback) {
  //   // console.log(Object.keys(req));
  //   // console.log(req.files);
  //   if (!file.originalname.match(/\.(jpg|png|gif)$/)) {
  //     return callback(
  //       new Error('The only formats allowed are PNG, JPG and GIF')
  //     );
  //   }
  //   callback(undefined, true);
  // },
});

export const userMulter = userMediaUpload.fields(userMediaTypes);
