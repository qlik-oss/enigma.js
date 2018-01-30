import deltaRequest from './interceptors/request/delta';
import apiResponse from './interceptors/response/api';
import deltaResponse from './interceptors/response/delta';
import errorResponse from './interceptors/response/error';
import outParamResponse from './interceptors/response/out-param';
import resultResponse from './interceptors/response/result';

class Intercept {
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

  executeRequests(session, promise) {
    return this.request.reduce((interception, interceptor) => {
      const intercept = interceptor.onFulfilled &&
        interceptor.onFulfilled.bind(this, session);
      return interception.then(intercept);
    }, promise);
  }

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
