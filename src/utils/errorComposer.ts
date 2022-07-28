const errorComposer = (error: any) => {
  const errorArray: { [key: string]: string[] } = {};
  const errorKeys: Array<string> = Object.keys(error.errors);
  errorKeys.forEach((key: any) => {
    const CapKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (!errorArray[key]) errorArray[key] = [];

    const errExtract = error.errors[key].properties.reason;
    if (errExtract) {
      errorArray[key] = errExtract.errorArray;
    }

    const dupeMessage = error.errors[key].properties.message;
    if (dupeMessage === 'dupe') {
      errorArray[key].push(
        `${CapKey} is being currently used, try a different one`
      );
    }

    if (error.errors[key].kind === 'maxlength' && key !== 'displayName') {
      errorArray[key].push(error.errors[key].properties.message);
    }

    if (error.errors[key].properties.type === 'required') {
      errorArray[key].push(`${CapKey} is empty`);
    }
  });
  return errorArray;
};

export default errorComposer;
