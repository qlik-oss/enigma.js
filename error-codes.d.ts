/**
 * This is a list of error codes that can be thrown from enigma.js API calls.
 * @entry
 * @see EnigmaError
 * @enum
 * @example <caption>Handling an enigma.js error</caption>
 * const { NOT_CONNECTED } = require('enigma.js/error-codes');
 * try {
 *   const layout = await model.getLayout();
 * } catch (err) {
 *   if (err.code === NOT_CONNECTED) {
 *     console.log('Tried to communicate on a session that is closed');
 *   }
 * }
 */
declare const errorCodes: {
  /**
   * You're trying to send data on a socket that's not connected.
   * @type {number}
   */
  NOT_CONNECTED: number;
  /**
   * The object you're trying to fetch does not exist.
   * @type {number}
   */
  OBJECT_NOT_FOUND: number;
  /**
   * Unexpected RPC response, expected array of patches.
   * @type {number}
   */
  EXPECTED_ARRAY_OF_PATCHES: number;
  /**
   * Not an object that can be patched.
   * @type {number}
   */
  PATCH_HAS_NO_PARENT: number;
  /**
   * This entry is already defined with another key.
   * @type {number}
   */
  ENTRY_ALREADY_DEFINED: number;
  /**
   * You need to supply a configuration.
   * @type {number}
   */
  NO_CONFIG_SUPPLIED: number;
  /**
   * There's no promise object available (polyfill required?).
   * @type {number}
   */
  PROMISE_REQUIRED: number;
  /**
   * The schema struct type you requested does not exist.
   * @type {number}
   */
  SCHEMA_STRUCT_TYPE_NOT_FOUND: number;
  /**
   * Can't override this function.
   * @type {number}
   */
  SCHEMA_MIXIN_CANT_OVERRIDE_FUNCTION: number;
  /**
   * Extend is not allowed for this mixin.
   * @type {number}
   */
  SCHEMA_MIXIN_EXTEND_NOT_ALLOWED: number;
  /**
   * Session suspended - no interaction allowed.
   * @type {number}
   */
  SESSION_SUSPENDED: number;
  /**
   * onlyIfAttached supplied, but you got SESSION_CREATED.
   * @type {number}
   */
  SESSION_NOT_ATTACHED: number;
};

export default errorCodes;
