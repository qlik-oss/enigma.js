/**
 * Create an enigmaError
 * @param {Number} code A proper error code from ../error-codes.js
 * @param {String} name A message/name of the enigmaError.
 */
export default function createEnigmaError(code, name) {
  const error = new Error(name);
  error.code = code;
  error.enigmaError = true; // To be able to properly identify an enigma error
  return error;
}
