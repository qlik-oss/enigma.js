import api from './interceptors/response/api';
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
  * @param {Boolean} options.delta Whether to use the delta protocol.
  * @param {Array} [options.interceptors] Additional interceptors to use.
  */
  constructor(options) {
    Object.assign(this, options);
    this.interceptors = [
      { onFulfilled: error },
      { onFulfilled: delta },
      { onFulfilled: result },
      { onFulfilled: outParam },
      { onFulfilled: api },
      ...this.interceptors || [],
    ];
  }

  /**
  * Execute the interceptor queue, each interceptor will get the result from
  * the previous interceptor.
  * @param {Object} session The session instance to execute against.
  * @param {Promise} promise The promise to chain on to.
  * @param {Object} request The JSONRPC request object for the intercepted response.
  * @returns {Promise}
  */
  execute(session, promise, request) {
    return this.interceptors.reduce(
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
