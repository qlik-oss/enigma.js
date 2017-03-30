import url from 'url';

// see getDefaultHTTPModule for additional imports due to webpack

const IS_NODE = typeof window === 'undefined';
const HTTP_200_OK_RANGE_START = 200;
const HTTP_200_OK_RANGE_END = 299;

function getDefaultHTTPModule(secure) {
  /* eslint no-eval:0, global-require:0 */
  if (IS_NODE) {
    const lib = secure ? 'https' : 'http';
    // avoid webpack grabbing this dependency and cause havoc:
    return eval(`require('${lib}')`);
  }
  /* istanbul ignore next */
  return require('http-browserify');
}

/**
 * Generates a (good enough) random XHR key used on each request against the service.
 *
 * @private
 * @returns {String} An XHR key.
 */
export function generateXrfKey() {
  return (Math.random() * 1e32).toString(36).slice(0, 16);
}

/**
 * Handles incoming responses from requests.
 *
 * @private
 * @param {ServiceRequestOptions} opts The options for the service request.
 * @param {Object} res The HTTP response object.
 * @param {Function} handleLog Logging callback
 */
export function responseHandler(opts, res, handleLog) {
  const data = [];
  // res.setEncoding('utf-8');
  res.on('data', data.push.bind(data));
  res.on('end', () => {
    const response = data.join('');

    // Add additional fields compatible with swagger-client
    res.status = res.statusCode;
    res.statusText = res.statusMessage;

    if (HTTP_200_OK_RANGE_START <= res.statusCode && res.statusCode <= HTTP_200_OK_RANGE_END) {
      res.data = response;
      try {
        res.obj = JSON.parse(response);
      } catch (ex) {
        // do not set out.obj
      }
      if (handleLog) {
        handleLog({ msg: 'Received', data: { body: res.data } });
      }
      opts.on.response(res);
    } else {
      if (handleLog) {
        handleLog({ msg: 'Received', data: { status: res.status, statusText: res.statusText } });
      }
      opts.on.error(res);
    }
  });
}

/**
 * Handles connection errors
 * @private
 * @param {ServiceRequestOptions} opts The options for the service request.
 * @param {Object} res The HTTP response object.
 * @param {Function} handleLog Logging callback
 */
export function errorHandler(opts, res, handleLog) {
  // Setup an error object compatible with swagger-client
  const error = {
    status: res.code,
    statusText: res.message || '',
    errObj: res,
  };
  if (!error.errObj.message) {
    error.errObj.message = '';
  }

  if (handleLog) {
    handleLog({ msg: 'Received', data: { status: error.status, statusText: error.statusText } });
  }
  opts.on.error(error);
}

/**
* Creates a request settings object needed to complete a call against a service.
*
* @private
* @param {RestOptions} restOpts The REST service configuration.
* @param {ServiceRequestOptions} reqOpts The specific request options.
*/
export function createRequestSettings(restOpts, reqOpts) {
  const uriParts = url.parse(reqOpts.url);
  const settings = {
    host: uriParts.hostname,
    port: uriParts.port,
    path: uriParts.pathname + (uriParts.search ? uriParts.search : ''),
    method: reqOpts.method || 'GET',
    headers: {
      'X-Qlik-Xrfkey': generateXrfKey(),
      'Content-Type': 'application/json',
    },
  };

  if (restOpts.headers) {
    Object.assign(settings.headers, restOpts.headers);
  }

  if (restOpts.secure && restOpts.certs) {
    settings.ca = restOpts.certs.ca;
    settings.cert = restOpts.certs.cert;
    settings.key = restOpts.certs.key;
    settings.rejectUnauthorized = true;
  }
  return settings;
}

/**
* @typedef HttpClientOptions
*
* @prop {Boolean} cachebust Whether to cachebust each request.
* @prop {String} url The fully-qualified root URL to the API Gateway.
*/

export default class HttpClient {
  /**
  * @param {HttpClientOptions} opts The options to use for this instance.
  * @param {RestOptions} restOpts The REST service configuration.
  */
  constructor(opts, restOpts) {
    if (!opts) {
      throw new Error('HttpClient requires an options object');
    }
    if (!restOpts) {
      throw new Error('HttpClient requires the REST configuration object');
    }
    this.serviceOpts = opts;
    this.restOpts = restOpts;
    /* istanbul ignore next */
    this.httpModule = restOpts.httpModule || getDefaultHTTPModule(restOpts.secure);
  }

  /*
   * The available options for a service request.
   *
   * @typedef ServiceRequestOptions
   * @prop {String} method The HTTP method to use, e.g. "GET", "POST".
   * @prop {String} url The fully-qualified URL to make the request against, e.g.
   *                    https://localhost:4242/api/test.
   * @prop {String} [body] The body to send with the request.
   * @prop {Function} [req] The request implementation to use (mainly used for testing).
   * @prop {Object} on The callbacks to invoke when the request is finalized.
   * @prop {Function} on.response Callback to invoke when the request was successful.
   *                              Gets two parameters, the `body` and the raw `response`.
   * @prop {Function} on.error Callback to invoke when there was an error doing the request.
   *                              Gets on parameter, `error`.
   */

  /**
   * @private
   * @param {ServiceRequestOptions} opts The service request options.
   */
  request(opts) {
    const restOpts = this.restOpts;
    const settings = createRequestSettings(restOpts, opts);
    const req = this.httpModule.request(settings);

    const hasBody = typeof opts.body !== 'undefined';
    if (hasBody) {
      req.write(opts.body);
    }

    if (restOpts.handleLog) {
      restOpts.handleLog({ msg: 'Sent', data: { request: settings, body: opts.body || null } });
    }
    /* istanbul ignore next */
    req.on('error', err => errorHandler(opts, err, restOpts.handleLog));
    /* istanbul ignore next */
    req.on('response', res => responseHandler(opts, res, restOpts.handleLog));
    req.end();
  }

  /**
  * Executes a request against a service.
  *
  * @param {ServiceRequestOptions} opts The service request options to use.
  */
  execute(opts) {
    /* istanbul ignore next */
    const req = opts.req || this.request;
    const newOpts = Object.assign({}, opts);

    if (this.serviceOpts.cachebust) {
      newOpts.url += `${newOpts.url.indexOf('?') > -1 ? '&' : '?'}cachebust=${new Date().getTime()}`;
    }

    req.call(this, newOpts, (err, response, body) => {
      if (err) {
        opts.on.error(err);
      } else {
        opts.on.response({ response, body });
      }
    });
  }
}
