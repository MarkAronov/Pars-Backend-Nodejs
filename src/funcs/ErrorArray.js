'use strict';

module.exports = class ErrorArray extends Error {
  constructor(array, name,...params) {
    super(...params)
    this.name = name
    this.arrayMessage = array
  }
}

