export default function createEnigmaError(code, name) {
  const error = new Error(name); // Name as string
  error.code = code; // Code from 'error-codes.js'
  error.enigmaError = true; // To be able to properly identify an enigma error
  return error;
}
