import deltaRequest from './interceptors/request/delta';
import apiResponse from './interceptors/response/api';
import deltaResponse from './interceptors/response/delta';
import errorResponse from './interceptors/response/error';
import outParamResponse from './interceptors/response/out-param';
import resultResponse from './interceptors/response/result';

class Intercept {
  /**
  * Create a new Intercept instance.
  * @param {Object} options The configuration options for this class.
  * @param {Promise} options.Promise The promise constructor to use.
  * @param {ApiCache} options.apis The ApiCache instance to use.
  * @param {Array<Object>} [options.request] The additional request interceptors to use.
  * @param {Array<Object>} [options.response] The additional response interceptors to use.
  */
  constructor(options) {
    Object.assign(this, options);
    this.request = [{ onFulfilled: deltaRequest }, ...this.request || []];
    this.response = [
      { onFulfilled: errorResponse },
      { onFulfilled: deltaResponse },
      { onFulfilled: resultResponse },
      { onFulfilled: outParamResponse },
      ...this.response || [],
      { onFulfilled: apiResponse },
    ];
  }

  /**
  * Execute the request interceptor queue, each interceptor will get the result from
  * the previous interceptor.
  * @param {Object} session The session instance to execute against.
  * @param {Promise} promise The promise to chain on to.
  * @returns {Promise}
  */
  executeRequests(session, promise) {
    return this.request.reduce((interception, interceptor) => {
      const intercept = interceptor.onFulfilled
      && interceptor.onFulfilled.bind(this, session);
      return interception.then(intercept);
    }, promise);
  }

  /**
  * Execute the response interceptor queue, each interceptor will get the result from
  * the previous interceptor.
  * @param {Object} session The session instance to execute against.
  * @param {Promise} promise The promise to chain on to.
  * @param {Object} request The JSONRPC request object for the intercepted response.
  * @returns {Promise}
  */
  executeResponses(session, promise, request) {
    return this.response.reduce((interception, interceptor) => interception.then(
      interceptor.onFulfilled && interceptor.onFulfilled.bind(this, session, request),
      interceptor.onRejected && interceptor.onRejected.bind(this, session, request),
    ),
    promise);
  }
}

export default Intercept;
