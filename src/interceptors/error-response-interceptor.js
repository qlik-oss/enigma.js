/**
* Process error interceptor.
* @private
* @param {Session} session - The session the intercept is being executed on.
* @param {Object} request - The JSON-RPC request.
* @param {Object} response - The response.
* @returns {Object} - Returns the defined error for an error, else the response.
*/
export default function errorResponseInterceptor(session, request, response) {
  if (typeof response.error !== 'undefined') {
    const data = response.error;
    const error = new Error(data.message);
    error.code = data.code;
    error.parameter = data.parameter;
    return session.config.Promise.reject(error);
  }
  return response;
}
