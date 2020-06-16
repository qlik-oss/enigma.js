/**
 * Error containing a custom error code.
 * @extends Error
 * @property {number} code The error code as defined by `errorCodes`
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
 * @private
 * @param {Number} code A proper error code from `errorCodes`
 * @param {String} name A message/name of the enigmaError.
 * @returns {EnigmaError}
 */
export default function createEnigmaError(code, name) {
  return new EnigmaError(name, code);
}
