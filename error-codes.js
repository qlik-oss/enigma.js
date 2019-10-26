export default {
  NOT_CONNECTED: -1, // You're trying to send data on a socket that's not created
  OBJECT_NOT_FOUND: -2, // The object you're trying to fetch does not exist
  EXPECTED_ARRAY_OF_PATCHES: -3, // Unexpected RPC response, expected array of patches
  PATCH_HAS_NO_PARENT: -4, // Patchee is not an object we can patch
  ENTRY_ALREADY_DEFINED: -5, // This entry is already defined with another key
  NO_CONFIG_SUPPLIED: -6, // You need to supply a configuration
  PROMISE_REQUIRED: -7, // There's no promise object available (polyfill required?)
  SCHEMA_STRUCT_TYPE_NOT_FOUND: -8, // The schema struct type you requested does not exist
  SCHEMA_MIXIN_CANT_OVERRIDE_FUNCTION: -9, // Can't override this function
  SCHEMA_MIXIN_EXTEND_NOT_ALLOWED: -10, // Extend is not allowed for this mixin
  SESSION_SUSPENDED: -11, // Session suspended - no interaction allowed
  SESSION_NOT_ATTACHED: -12, // onlyIfAttached supplied, but you got SESSION_CREATED
};
