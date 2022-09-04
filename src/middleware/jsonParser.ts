const jsonParser = (req, res, next) => {

  console.log('Time:', Date.now());
  next();
};

export default jsonParser;
