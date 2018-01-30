/**
 * @module ResponseInterceptor:Delta
 */

import JSONPatch from '../../json-patch';
import KeyValueCache from '../../cache';

const sessions = {};

const bindSession = (session) => {
  if (!sessions[session.id]) {
    const cache = {};
    sessions[session.id] = cache;
    session.on('traffic:received', data => data.close && data.close.forEach(handle => delete cache[handle]));
    session.on('closed', () => delete sessions[session.id]);
  }
};

const getHandleCache = (session, handle) => {
  bindSession(session);
  const cache = sessions[session.id];
  if (!cache[handle]) {
    cache[handle] = new KeyValueCache();
  }
  return cache[handle];
};

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
* @param {Session} session The session the intercept is being executed on.
* @param {object} request The JSON-RPC request.
* @param {object} response The response.
* @returns {object} Returns the patched response
*/
export default function deltaInterceptor(session, request, response) {
  const { delta, result } = response;
  if (delta) {
    // when delta is on the response data is expected to be an array of patches:
    Object.keys(result).forEach((key) => {
      if (!Array.isArray(result[key])) {
        throw new Error('Unexpected RPC response, expected array of patches');
      }
      result[key] = patchValue(session, request.handle, `${request.method}-${key}`, result[key]);
    });
    // return a cloned response object to avoid patched object references:
    return JSON.parse(JSON.stringify(response));
  }
  return response;
}

// export object reference for testing purposes:
deltaInterceptor.sessions = sessions;
