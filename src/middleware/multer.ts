import multer from 'multer';
import * as crypto from 'crypto';
// import { fileTypeFromFile } from 'file-type';

// / MULTER SETTINGS ///
const megabyte = 1000000;

const userMediaTypes = [
  { name: 'avatar', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
];
const postMediaTypes = [
  { name: 'videos', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'datafiles', maxCount: 3 },
];

const userMediaUpload = multer({
  limits: {
    fileSize: 10 * megabyte,
    files: 1,
  },
  storage: multer.diskStorage({
    destination: async (
      req: any,
      file: { fieldname: any },
      cb: (arg0: null, arg1: string) => void
    ) => {
      cb(null, `./media/${file.fieldname}s`);
    },
    filename: async (
      req: any,
      file: { fieldname: string },
      cb: (arg0: null, arg1: string) => void
    ) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      cb(null, file.fieldname + '-' + Date.now() + '-' + uniqueSuffix);
    },
  }),
});

const postMediaUpload = multer({
  limits: {
    fileSize: 75 * megabyte,
    files: 5,
  },
  storage: multer.diskStorage({
    destination: async (
      req: any,
      file: { fieldname: any },
      cb: (arg0: null, arg1: string) => void
    ) => {
      cb(null, `./media/${file.fieldname}`);
    },
    filename: async (
      req: any,
      file: { fieldname: string },
      cb: (arg0: null, arg1: string) => void
    ) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      cb(null, file.fieldname + '-' + Date.now() + '-' + uniqueSuffix);
    },
  }),
});

export const userMulter = userMediaUpload.fields(userMediaTypes);
export const postMulter = postMediaUpload.fields(postMediaTypes);
