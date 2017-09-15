import JSONPatch from '../../json-patch';

/**
* Function used to determine if it is a primitive value.
* @param  {Any} value.
* @return {Boolean} Returns true if it is a primitive value.
*/
const isPrimitiveValue = value =>
  typeof value !== 'undefined' &&
  value !== null &&
  typeof value !== 'object' &&
  !Array.isArray(value);

/**
* Function used to determine if it is a primitive patch.
* @param  {Array}  patches Patches from engine.
* @return {Boolean} Returns true if it is a primitive patch.
*/
const isPrimitivePatch = patches =>
  // It's only `add` and `replace` that has a
  // value property according to the jsonpatch spec
  patches.length === 1 &&
  ['add', 'replace'].indexOf(patches[0].op) !== -1 &&
  isPrimitiveValue(patches[0].value) &&
  patches[0].path === '/';

/**
* Function used to get a patchee.
* @param {Number} handle - The handle.
* @param {Array} patches - The patches.
* @param {String} cacheId - The cacheId.
* @returns {Object} Returns the patchee.
*/
const getPatchee = (apis, handle, patches, cacheId) => {
  // handle primitive types, e.g. string, int, bool
  if (isPrimitivePatch(patches)) {
    const { value } = patches[0];
    apis.setPatchee(handle, cacheId, value);
    return value;
  }

  let patchee = apis.getPatchee(handle, cacheId);

  if (!isPrimitiveValue(patchee)) {
    patchee = patchee || (patches.length && Array.isArray(patches[0].value) ? [] : {});
    JSONPatch.apply(patchee, patches);
  }

  apis.setPatchee(handle, cacheId, patchee);

  return patchee;
};

/**
* Process delta interceptor.
* @param {Object} session - The session the intercept is being executed on.
* @param {Object} request - The JSON-RPC request.
* @param {Object} response - The response.
* @returns {Object} - Returns the patched response
*/
export default function deltaInterceptor(session, request, response) {
  const { result } = response;
  if (response.delta) {
    // when delta is on the response data is expected to be an array of patches
    const keys = Object.keys(result);
    for (let i = 0, cnt = keys.length; i < cnt; i += 1) {
      const key = keys[i];
      const patches = result[key];
      if (!Array.isArray(patches)) {
        throw new Error('Unexpected rpc response, expected array of patches');
      }
      result[key] = getPatchee(
        session.apis,
        request.handle,
        patches,
        `${request.method}-${key}`,
      );
    }
    // return a cloned response object to avoid patched object references:
    return JSON.parse(JSON.stringify(response));
  }
  return response;
}
