import KeyValueCache from './cache';

/**
* API cache for instances of QIX types, e.g. GenericObject.
* @extends KeyValueCache
*/
class ApiCache extends KeyValueCache {

  /**
  * Create a new ApiCache instance.
  * @param {Object} options The configuration options for this class.
  * @param {Promise} options.Promise The promise constructor to use.
  * @param {Schema} options.schema The schema instance to use.
  */
  constructor(options) {
    super();
    Object.assign(this, options);
  }

  /**
  * Event handler for triggering API instance events when their handle
  * is changed.
  * @emits api#changed
  */
  onHandleChanged(handle) {
    const api = this.getApi(handle);
    if (api) {
      api.emit('changed');
    }
  }

  /**
  * Event handler for triggering API instance events when their handle
  * is closed.
  * @emits api#closed
  */
  onHandleClosed(handle) {
    const api = this.getApi(handle);
    if (api) {
      api.emit('closed');
      this.remove(handle);
    }
  }

  /**
  * Event handler for cleaning up API instances when a session has been closed.
  * @emits api#closed
  */
  onSessionClosed() {
    this.getApis().forEach((entry) => {
      entry.api.emit('closed');
      entry.api.removeAllListeners();
    });
    this.clear();
  }

  /**
  * Function used to get an API for a backend object.
  * Requires a session instance on `this.session`.
  * @param {Object} args - Arguments used to create object API.
  * @param {Number} args.handle - Handle of the backend object.
  * @param {String} args.id - ID of the backend object.
  * @param {String} args.type - QIX type of the backend object. Can for example
  *                             be "Doc" or "GenericVariable".
  * @param {String} args.customType - Custom type of the backend object, if defined in qInfo.
  * @param {Boolean} [args.delta=true] - Flag indicating if delta should be used or not.
  * @returns {*} Returns the generated and possibly augmented API.
  */
  getObjectApi(args) {
    const { handle, id, type, customType, delta = true } = args;
    let api = this.getApi(handle);
    if (api) {
      return api;
    }
    api = this.schema
      .generate(type)
      .create(this.session, handle, id, delta, customType);
    this.add(handle, api);
    return api;
  }

  /**
  * Adds an API.
  * @function ApiCache#add
  * @param {Number} handle - The handle for the API.
  * @param {*} api - The API.
  * @returns {{api: *, deltaCache}} The entry.
  */
  add(handle, api) {
    const entry = {
      api,
      deltaCache: new KeyValueCache(),
    };
    super.add(handle.toString(), entry);
    return entry;
  }

  /**
  * Gets an API.
  * @function ApiCache#getApi
  * @param {Number} handle - The handle for the API.
  * @returns {*} The API for the handle.
  */
  getApi(handle) {
    const entry = typeof handle !== 'undefined' ? this.get(handle.toString()) : undefined;
    return entry && entry.api;
  }

  /**
  * Gets a list of APIs.
  * @function ApiCache#getApis
  * @returns {Array} The list of entries including `handle` and `api` properties for each entry.
  */
  getApis() {
    return super.getAll().map(entry =>
      ({
        handle: entry.key,
        api: entry.value.api,
      })
    );
  }

  /**
  * Gets a list of APIs with a given type.
  * @function ApiCache#getApisByType
  * @param {String} type - The type of APIs to get.
  * @returns {Array} The list of entries including `handle` and `api` properties for each entry.
  */
  getApisByType(type) {
    return this.getApis().filter(entry => entry.api.type === type);
  }

  /**
  * Gets a patchee.
  * @function ApiCache#getPatchee
  * @param {Number} handle - The handle for the API to patch.
  * @param {String} method - The method to patch.
  * @returns {*} The patchee.
  */
  getPatchee(handle, method) {
    const entry = this.get(handle.toString());
    return entry && entry.deltaCache.get(method);
  }

  /**
  * Adds a patchee.
  * @function ApiCache#addPatchee
  * @param {Number} handle - The handle for the API to patch.
  * @param {String} method - The method to patch.
  * @param {Object} patchee - The patchee to add.
  */
  addPatchee(handle, method, patchee) {
    this.get(handle.toString()).deltaCache.add(method, patchee);
  }

  /**
  * Sets a patchee.
  * @function ApiCache#setPatchee
  * @param {Number} handle - The handle for the API.
  * @param {String} method - The method.
  * @param {Object} patchee - The patchee to add.
  */
  setPatchee(handle, method, patchee) {
    this.get(handle.toString()).deltaCache.set(method, patchee);
  }
}

export default ApiCache;
