import KeyValueCache from './cache';

/**
* API cache for instances of QIX types, e.g. GenericObject.
* @extends KeyValueCache
*/
class ApiCache extends KeyValueCache {
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
      }),
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
