/**
 * @module ResponseInterceptor:Result
 */

/**
* Process result interceptor.
* @param {object} session - The session the intercept is being executed on.
* @param {object} request - The JSON-RPC request.
* @param {object} response - The response.
* @returns {object} - Returns the result property on the response
*/
export default function resultInterceptor(session, request, response) {
  return response.result;
}
