import KeyValueCache from '../../cache';

/**
* Api cache.
* @extends KeyValueCache
*/
class ApiCache extends KeyValueCache {

  constructor(apis = []) {
    super();
    apis.forEach(api => this.add(api.handle, api));
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
  * Gets an api.
  * @function ApiCache#getApi
  * @param {Number} handle - The handle for the API.
  * @returns {*} The API for the handle.
  */
  getApi(handle) {
    const entry = this.get(handle.toString());
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
  * @param {Number} handle - The handle for the api.
  * @param {String} method - The method.
  * @param {Object} patchee - The patchee to add.
  */
  setPatchee(handle, method, patchee) {
    this.get(handle.toString()).deltaCache.set(method, patchee);
  }
}

export default ApiCache;
