/**
 * An error array class for better error handling
 */
class ErrorAO extends Error {
  errorArray:
    | {
        [key: string]: string[];
      }
    | string[][];

  /**
   * the constructor
   * @param {Array} errorArray the error array list
   * @param {string} name the error name
   * @param {array} params the other parameters
   */
  constructor(
    errorArray?:
      | {
          [key: string]: string[];
        }
      | string[],
    name?: string,
    ...params: Array<string>
  ) {
    super(...params);
    this.name = name ? name : '';
    this.errorArray = errorArray ? errorArray : {};
  }
}

export default ErrorAO;
