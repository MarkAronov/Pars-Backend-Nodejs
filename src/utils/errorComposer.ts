
const errorComposer = (error: any) => {
  const errorArray: { [key: string]: any } = {};
  const errorKeys: Array<string> = Object.keys(error.errors);

  errorKeys.forEach((key: any) => {
    const keyType = key as keyof typeof String;
    const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
    console.log(errorKey,error.errors[keyType]);
    if (!errorArray[key]) errorArray[keyType] = [];
    //   if (error.errors[keyType].error) {
    //     errorArray[key] = error.errors[keyType].error.errorArray;
    //   }
    //   if (error.errors[keyType].properties.type === 'required') {
    //     errorArray[key].push([
    //       'validation',
    //       `${errorKey} is being currently used, try another`,
    //     ]);
    //   }
    //   if (error.errors[keyType].kind === 'maxlength' && key !== 'displayName') {
    //     errorArray[key].push([
    //       'validation',
    //       error.errors[keyType].properties.message,
    //     ]);
    //   }
    //   if (
    //     (key === 'email' || key === 'username') &&
    //     error.errors[keyType].properties.type === 'unique'
    //   ) {
    //     errorArray[key].push([
    //       'dupe',
    //       `${errorKey} is already used, try a different one`,
    //     ]);
    //   }
    //   if (error.errors[keyType].properties.type === 'required') {
    //     errorArray[key].push(['required', `${errorKey} is empty`]);
    //   }
  });
  return errorArray;
};

export default errorComposer;
