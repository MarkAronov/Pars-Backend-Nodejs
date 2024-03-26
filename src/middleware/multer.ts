/* eslint-disable no-unused-vars */
import multer from 'multer';
import * as crypto from 'crypto';

/// MULTER SETTINGS ///
const megabyte = 1000000;

const storage = multer.diskStorage({
  destination: async (req, file, cb: (arg0: null, arg1) => void) => {
    const isUserRoute = req.route.path.toString().indexOf('/users') >= 0;
    const folder = `./media/${file.fieldname}${isUserRoute ? 's' : ''}`;
    cb(null, folder);
  },
  filename: async (req, file, cb: (arg0: null, arg1: string) => void) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, file.fieldname + '-' + Date.now() + '-' + uniqueSuffix);
  },
});

/// MULTER MIDDLEWARES ///

export const userMulter = multer({
  limits: {
    fileSize: 10 * megabyte,
    files: 2,
  },
  storage: storage,
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
]);

export const postMulter = multer({
  limits: {
    fileSize: 75 * megabyte,
    files: 5,
  },
  storage: storage,
}).fields([
  { name: 'videos', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'datafiles', maxCount: 3 },
]);
