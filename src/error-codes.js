
/**
 * @enum
 */
const errorCodes = {
  /**
   * You're trying to send data on a socket that's not created
   * @type {number}
   */
  NOT_CONNECTED: -1,
  /**
   * The object you're trying to fetch does not exist
   * @type {number}
   */
  OBJECT_NOT_FOUND: -2,
  /**
   * You're trying to send data on a socket that's not created
   * @type {number}
   */
  EXPECTED_ARRAY_OF_PATCHES: -3,
  /**
   * Patchee is not an object we can patch
   * @type {number}
   */
  PATCH_HAS_NO_PARENT: -4,
  /**
   * This entry is already defined with another key
   * @type {number}
   */
  ENTRY_ALREADY_DEFINED: -5,
  /**
   * You need to supply a configuration
   * @type {number}
   */
  NO_CONFIG_SUPPLIED: -6,
  /**
   * There's no promise object available (polyfill required?)
   * @type {number}
   */
  PROMISE_REQUIRED: -7,
  /**
   * The schema struct type you requested does not exist
   * @type {number}
   */
  SCHEMA_STRUCT_TYPE_NOT_FOUND: -8,
  /**
   * Can't override this function
   * @type {number}
   */
  SCHEMA_MIXIN_CANT_OVERRIDE_FUNCTION: -9,
  /**
   * Extend is not allowed for this mixin
   * @type {number}
   */
  SCHEMA_MIXIN_EXTEND_NOT_ALLOWED: -10,
  /**
   * Session suspended - no interaction allowed
   * @type {number}
   */
  SESSION_SUSPENDED: -11,
  /**
   * onlyIfAttached supplied, but you got SESSION_CREATED
   * @type {number}
   */
  SESSION_NOT_ATTACHED: -12,
};

export default errorCodes;
