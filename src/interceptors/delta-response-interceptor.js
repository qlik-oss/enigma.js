import JSONPatch from '../json-patch';
import KeyValueCache from '../key-value-cache';

import createEnigmaError from '../error';
import errorCodes from '../error-codes';

const sessions = {};

/**
* Function to make sure we release handle caches when they are closed.
* @private
* @param {Session} session The session instance to listen on.
*/
const bindSession = (session) => {
  if (!sessions[session.id]) {
    const cache = {};
    sessions[session.id] = cache;
    session.on('traffic:received', (data) => data.close && data.close.forEach((handle) => delete cache[handle]));
    session.on('closed', () => delete sessions[session.id]);
  }
};

/**
* Simple function that ensures the session events has been bound, and returns
* either an existing key-value cache or creates one for the specified handle.
* @private
* @param {Session} session The session that owns the handle.
* @param {Number} handle The object handle to retrieve the cache for.
* @returns {KeyValueCache} The cache instance.
*/
const getHandleCache = (session, handle) => {
  bindSession(session);
  const cache = sessions[session.id];
  if (!cache[handle]) {
    cache[handle] = new KeyValueCache();
  }
  return cache[handle];
};

/**
* Function used to apply a list of patches and return the patched value.
* @private
* @param {Session} session The session.
* @param {Number} handle The object handle.
* @param {String} cacheId The cacheId.
* @param {Array} patches The patches.
* @returns {Object} Returns the patched value.
*/
const patchValue = (session, handle, cacheId, patches) => {
  const cache = getHandleCache(session, handle);
  let entry = cache.get(cacheId);
  if (typeof entry === 'undefined') {
    entry = Array.isArray(patches[0].value) ? [] : {};
  }
  if (patches.length) {
    if (patches[0].path === '/' && typeof patches[0].value !== 'object') {
      // 'plain' values on root path is not supported (no object reference),
      // so we simply store the value directly:
      entry = patches[0].value;
    } else {
      JSONPatch.apply(entry, patches);
    }
    cache.set(cacheId, entry);
  }
  return entry;
};

/**
* Process delta interceptor.
* @private
* @param {Session} session The session the intercept is being executed on.
* @param {Object} request The JSON-RPC request.
* @param {Object} response The response.
* @returns {Object} Returns the patched response
*/
export default function deltaResponseInterceptor(session, request, response) {
  const { delta, result } = response;
  if (delta) {
    // when delta is on the response data is expected to be an array of patches:
    Object.keys(result).forEach((key) => {
      if (!Array.isArray(result[key])) {
        throw createEnigmaError(errorCodes.EXPECTED_ARRAY_OF_PATCHES, 'Unexpected RPC response, expected array of patches');
      }
      result[key] = patchValue(session, request.handle, `${request.method}-${key}`, result[key]);
    });
    // return a cloned response object to avoid patched object references:
    return JSON.parse(JSON.stringify(response));
  }
  return response;
}

// export object reference for testing purposes:
deltaResponseInterceptor.sessions = sessions;
