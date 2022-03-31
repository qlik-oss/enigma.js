/**
 * Error containing a custom error code.
 * @extends Error
 * @property {number} code The error code as defined by `errorCodes`.
 * @property {boolean} enigmaError=true
 * @property {Object} [original] the websocket event that is the source of the error.
 */
class EnigmaError extends Error {
  constructor(name, code, original) {
    super(name);
    this.code = code;
    this.enigmaError = true;
    this.original = original;
  }
}

/**
 * Create an enigmaError
 * @private
 * @param {Number} code A proper error code from `errorCodes`
 * @param {String} name A message/name of the enigmaError.
 * @param {Object} [original] the websocket event that is the source of the error.
 * @returns {EnigmaError}
 */
export default function createEnigmaError(code, name, original) {
  return new EnigmaError(name, code, original);
}
