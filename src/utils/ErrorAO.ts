/**
 * An error array class for better error handling
 */
class ErrorAO extends Error {
  errorAO:
    | {
        [key: string]: string[];
      }
    | string[];

  status: number;

  /**
   * the constructor
   * @param {Array} errorAO the error array list or object list
   * @param {string} name the error name
   * @param {array} params the other parameters
   */
  constructor(
    errorAO?:
      | {
          [key: string]: string[];
        }
      | string[],
    name?: string,
    status?: number,
    ...params: string[]
  ) {
    super(...params);
    this.name = name ? name : '';
    this.status = status ? status : 400;
    this.errorAO = errorAO ? errorAO : {};
  }
}

export default ErrorAO;
