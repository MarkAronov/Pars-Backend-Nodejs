exports.errorComposer = (err) => {
  const errors = {};
  Object.keys(err.errors).forEach((key) => {
    const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (!errors[key]) errors[key] = [];
    if (err.errors[key].reason) {
      errors[key] = err.errors[key].reason.arrayMessage;
    }
    if (err.errors[key].properties.type === 'required') {
      errors[key].push([
        'validation',
        `${errorKey} is being currently used, try another`,
      ]);
    }
    if (err.errors[key].kind === 'maxlength' && key !== 'displayName') {
      errors[key].push(['validation', err.errors[key].properties.message]);
    }
    if (
      (key === 'email' || key === 'username') &&
      err.errors[key].properties.type === 'unique'
    ) {
      errors[key].push([
        'dupe',
        `${errorKey} is already used, try a different one`,
      ]);
    }
    if (err.errors[key].properties.type === 'required') {
      errors[key].push(['required', `${errorKey} is empty`]);
    }
  });
  return errors;
};
