import ErrorAO from '../utils/ErrorAO.js';
import { Request } from 'src/utils/types.js';
import { Response, NextFunction } from 'express';

const jsonParser = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && Object.keys(req.body).includes('content')) {
    try {
      const reqJSONContent =
        typeof JSON.parse(req.body.content) === 'string'
          ? JSON.parse(JSON.parse(req.body.content))
          : JSON.parse(req.body.content);
      delete req.body.content;
      req.body = Object.assign({}, req.body, reqJSONContent);
    } catch (err) {
      throw new ErrorAO({ MAIN: ['invalid JSON string'] }, 'ParameterError');
    }
  }
  next();
};

export default jsonParser;
