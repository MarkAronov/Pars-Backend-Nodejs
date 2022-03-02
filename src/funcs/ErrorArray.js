'use strict';

module.exports = class ErrorArray extends Error {
  /**
   * the constructor
   * @param {any} array the error array list
   * @param {string} name the error name
   * @param {array} params the other parameters
   */
  constructor(array, name, ...params) {
    super(...params);
    this.name = name;
    this.arrayMessage = array;
  }
};
