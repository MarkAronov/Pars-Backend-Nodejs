import ErrorAO from '../utils/ErrorAO.js';

const jsonParser = (req, res, next) => {
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
