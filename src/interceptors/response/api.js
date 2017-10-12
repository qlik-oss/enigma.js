/**
* Response interceptor for generating APIs. Handles the quirks of engine not
* returning an error when an object is missing.
* @param {Object} session - The session the intercept is being executed on.
* @param {Object} request - The JSON-RPC request.
* @param {Object} response - The response.
* @returns {Object} - Returns the generated API
*/
export default function apiInterceptor(session, request, response) {
  if (response.qHandle && response.qType) {
    return session.getObjectApi({
      handle: response.qHandle,
      type: response.qType,
      id: response.qGenericId,
      genericType: response.qGenericType,
    });
  } else if (response.qHandle === null && response.qType === null) {
    return session.Promise.reject(new Error('Object not found'));
  }
  return response;
}
