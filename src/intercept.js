const RETURN_KEY = 'qReturn';

class Intercept {
  /**
  * Create a new Intercept instance.
  * @param {Object} options The configuration options for this class.
  * @param {Promise} options.Promise The promise constructor to use.
  * @param {ApiCache} options.apis The ApiCache instance to use.
  * @param {Boolean} options.delta Whether to use the delta protocol.
  * @param {Array} [options.interceptors] Additional interceptors to use.
  * @param {JSONPatch} [options.JSONPatch] The JSONPatch implementation to use (for testing).
  */
  constructor(options) {
    Object.assign(this, options);
    this.interceptors = [{
      onFulfilled: this.processErrorInterceptor,
    }, {
      onFulfilled: this.processDeltaInterceptor,
    }, {
      onFulfilled: this.processResultInterceptor,
    }, {
      onFulfilled: this.processMultipleOutParamInterceptor,
    }, {
      onFulfilled: this.processOutInterceptor,
    }, {
      onFulfilled: this.processObjectApiInterceptor,
    }, ...this.interceptors || []];
  }

  /**
  * Function used to determine if it is a primitive patch.
  * @param  {Array}  patches Patches from engine.
  * @return {Boolean} Returns true if it is a primitive patch.
  */
  isPrimitivePatch(patches) {
    // It's only `add` and `replace` that has a
    // value property according to the jsonpatch spec
    return patches.length === 1 &&
    ['add', 'replace'].indexOf(patches[0].op) !== -1 &&
    this.isPrimitiveValue(patches[0].value) &&
    patches[0].path === '/';
  }

  /**
  * Function used to determine if it is a primitive value.
  * @param  {Any} value.
  * @return {Boolean} Returns true if it is a primitive value.
  */
  isPrimitiveValue(value) {
    return typeof value !== 'undefined' && value !== null && typeof value !== 'object' && !Array.isArray(value);
  }

  /**
  * Function used to get a patchee.
  * @param {Number} handle - The handle.
  * @param {Array} patches - The patches.
  * @param {String} cacheId - The cacheId.
  * @returns {Object} Returns the patchee.
  */
  getPatchee(handle, patches, cacheId) {
    // handle primitive types, e.g. string, int, bool
    if (this.isPrimitivePatch(patches)) {
      const value = patches[0].value;
      this.apis.setPatchee(handle, cacheId, value);
      return value;
    }

    let patchee = this.apis.getPatchee(handle, cacheId);

    if (!this.isPrimitiveValue(patchee)) {
      patchee = patchee || (patches.length && Array.isArray(patches[0].value) ? [] : {});
      this.applyPatch(patchee, patches);
    }

    this.apis.setPatchee(handle, cacheId, patchee);

    return patchee;
  }

  /**
  * Function used to apply a patch.
  * @param {Object} patchee - The object to patch.
  * @param {Array} patches - The list of patches to apply.
  */
  applyPatch(patchee, patches) {
    this.JSONPatch.apply(patchee, patches);
  }

  /**
  * Process error interceptor.
  * @param {Object} meta - The meta info about the request.
  * @param response - The response.
  * @returns {Object} - Returns the defined error for an error, else the response.
  */
  processErrorInterceptor(meta, response) {
    if (typeof response.error !== 'undefined') {
      return this.Promise.reject(response.error);
    }
    return response;
  }

  /**
  * Process delta interceptor.
  * @param {Object} meta - The meta info about the request.
  * @param response - The response.
  * @returns {Object} - Returns the patched response
  */
  processDeltaInterceptor(meta, response) {
    const result = response.result;
    if (response.delta) {
      // when delta is on the response data is expected to be an array of patches
      const keys = Object.keys(result);
      for (let i = 0, cnt = keys.length; i < cnt; i += 1) {
        const key = keys[i];
        const patches = result[key];
        if (!Array.isArray(patches)) {
          return this.Promise.reject('Unexpected rpc response, expected array of patches');
        }
        result[key] = this.getPatchee(meta.handle, patches, `${meta.method}-${key}`);
      }
      // return a cloned response object to avoid patched object references:
      return JSON.parse(JSON.stringify(response));
    }
    return response;
  }

  /**
  * Process result interceptor.
  * @param {Object} meta - The meta info about the request.
  * @param response - The response.
  * @returns {Object} - Returns the result property on the response
  */
  processResultInterceptor(meta, response) {
    return response.result;
  }

  /**
  * Processes specific QIX methods that are breaking the protocol specification
  * and normalizes the response.
  * @param {Object} meta - The meta info about the request.
  * @param response - The response.
  * @returns {Object} - Returns the result property on the response
  */
  processMultipleOutParamInterceptor(meta, response) {
    if (meta.method === 'CreateSessionApp' || meta.method === 'CreateSessionAppFromApp') {
      // this method returns multiple out params that we need
      // to normalize before processing the response further:
      response[RETURN_KEY].qGenericId = response[RETURN_KEY].qGenericId || response.qSessionAppId;
    } else if (meta.method === 'GetInteract') {
      // this method returns a qReturn value when it should only return
      // meta.outKey:
      delete response[RETURN_KEY];
    }
    return response;
  }

  /**
  * Process out interceptor.
  * @param {Object} meta - The meta info about the request.
  * @param response - The result.
  * @returns {Object} - Returns the out property on result
  */
  processOutInterceptor(meta, response) {
    if (hasOwnProperty.call(response, RETURN_KEY)) {
      return response[RETURN_KEY];
    } else if (meta.outKey !== -1) {
      return response[meta.outKey];
    }
    return response;
  }

  /**
  * Function used to process the object API interceptor.
  * @param {Object} meta - The meta info about the request.
  * @param response - The response.
  * @returns {Object} - Returns an object API or the response.
  */
  processObjectApiInterceptor(meta, response) {
    if (response.qHandle && response.qType) {
      return this.apis.getObjectApi({
        handle: response.qHandle,
        type: response.qType,
        id: response.qGenericId,
        customType: response.qGenericType,
        delta: this.delta,
      });
    } else if (response.qHandle === null && response.qType === null) {
      // TODO: reject?
      return null;
    }
    return response;
  }

  /**
  * Execute the interceptor queue, each interceptor will get the result from
  * the previous interceptor.
  * @param {Promise} promise The promise to chain on to.
  * @param {Object} meta The JSONRPC request object for the intercepted response.
  * @returns {Promise}
  */
  execute(promise, meta) {
    return this.interceptors.reduce((interception, interceptor) =>
      interception.then(
      interceptor.onFulfilled && interceptor.onFulfilled.bind(this, meta),
      interceptor.onRejected && interceptor.onRejected.bind(this, meta))
      , promise
    );
  }
}

export default Intercept;
