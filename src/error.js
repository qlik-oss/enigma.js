
/**
 * Error containing a custom error code.
 * @extends Error
 * @property {number} code The error code
 * @property {boolean} enigmaError=true
 */
class EnigmaError extends Error {
  constructor(name, code) {
    super(name);
    this.code = code;
    this.enigmaError = true;
  }
}

/**
 * Create an enigmaError
 * @param {Number} code A proper error code from ../error-codes.js
 * @param {String} name A message/name of the enigmaError.
 * @returns {EnigmaError}
 */
export default function createEnigmaError(code, name) {
  return new EnigmaError(name, code);
}
