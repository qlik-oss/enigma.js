/**
* Process result interceptor.
* @private
* @param {Session} session - The session the intercept is being executed on.
* @param {Object} request - The JSON-RPC request.
* @param {Object} response - The response.
* @returns {Object} - Returns the result property on the response
*/
export default function resultResponseInterceptor(session, request, response) {
  return response.result;
}
