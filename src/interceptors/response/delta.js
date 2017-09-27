import JSONPatch from '../../json-patch';
import KeyValueCache from '../../cache';

const sessions = {};
const handles = {};

/**
* Function to make sure we release handle caches when they are closed.
*
* @param {Session} session The session instance to listen on.
*/
const bindSession = (session) => {
  if (!sessions[session.id]) {
    sessions[session.id] = true;
    session.on('traffic:received', (data) => {
      if (data.close) {
        data.close.forEach(handle => delete handles[`${session.id}-${handle}`]);
      }
    });
  }
};

/**
* Simple function that ensures the session events has been bound, and returns
* either an existing key-value cache or creates one for the specified handle.
*
* @param {Session} session The session that owns the handle.
* @param {Number} handle The object handle to retrieve the cache for.
* @returns {KeyValueCache} The cache instance.
*/
const getHandleCache = (session, handle) => {
  bindSession(session);
  const id = `${session.id}-${handle}`;
  if (!handles[id]) {
    handles[id] = new KeyValueCache();
  }
  return handles[id];
};

/**
* Function used to apply a list of patches and return the patched value.
* @param {Session} session The session.
* @param {Number} handle The object handle.
* @param {String} cacheId The cacheId.
* @param {Array} patches The patches.
* @returns {Object} Returns the patched value.
*/
const patchValue = (session, handle, cacheId, patches) => {
  const cache = getHandleCache(session, handle);
  let entry = cache.get(cacheId) || (Array.isArray(patches[0].value) ? [] : {});
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
* @param {Session} session The session the intercept is being executed on.
* @param {Object} request The JSON-RPC request.
* @param {Object} response The response.
* @returns {Object} Returns the patched response
*/
export default function deltaInterceptor(session, request, response) {
  const { delta, result } = response;
  if (delta) {
    // when delta is on the response data is expected to be an array of patches:
    const keys = Object.keys(result);
    for (let i = 0, cnt = keys.length; i < cnt; i += 1) {
      const key = keys[i];
      const patches = result[key];
      if (!Array.isArray(patches)) {
        throw new Error('Unexpected rpc response, expected array of patches');
      }
      result[key] = patchValue(session, request.handle, `${request.method}-${key}`, patches);
    }
    // return a cloned response object to avoid patched object references:
    return JSON.parse(JSON.stringify(response));
  }
  return response;
}
