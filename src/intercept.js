import delta from './interceptors/response/delta';
import error from './interceptors/response/error';
import outParam from './interceptors/response/out-param';
import result from './interceptors/response/result';

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
    this.request = [...this.request || []];
    this.response = [
      { onFulfilled: error },
      { onFulfilled: delta },
      { onFulfilled: result },
      { onFulfilled: outParam },
      ...this.response || [],
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
      const intercept = interceptor.onFulfilled &&
        interceptor.onFulfilled.bind(this, session);
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
    return this.response.reduce(
      (interception, interceptor) =>
        interception.then(
          interceptor.onFulfilled && interceptor.onFulfilled.bind(this, session, request),
          interceptor.onRejected && interceptor.onRejected.bind(this, session, request),
        )
      , promise,
    );
  }
}

export default Intercept;
