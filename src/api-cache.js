import KeyValueCache from './key-value-cache';

/**
* API cache for instances of QIX types, e.g. GenericObject.
* @private
* @extends KeyValueCache
*/
class ApiCache extends KeyValueCache {
  /**
  * Adds an API.
  * @private
  * @function ApiCache#add
  * @param {Number} handle - The handle for the API.
  * @param {*} api - The API.
  * @returns {{api: *}} The entry.
  */
  add(handle, api) {
    const entry = { api };
    super.add(handle.toString(), entry);
    api.on('closed', () => this.remove(handle));
    return entry;
  }

  /**
  * Gets an API.
  * @private
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
  * @private
  * @function ApiCache#getApis
  * @returns {Array} The list of entries including `handle` and `api` properties for each entry.
  */
  getApis() {
    return super.getAll().map((entry) => ({
      handle: entry.key,
      api: entry.value.api,
    }));
  }

  /**
  * Gets a list of APIs with a given type.
  * @private
  * @function ApiCache#getApisByType
  * @param {String} type - The type of APIs to get.
  * @returns {Array} The list of entries including `handle` and `api` properties for each entry.
  */
  getApisByType(type) {
    return this.getApis().filter((entry) => entry.api.type === type);
  }
}

export default ApiCache;
