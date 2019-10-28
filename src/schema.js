import KeyValueCache from './key-value-cache';
import Events from './event-emitter';

import createEnigmaError from './error';
import errorCodes from './error-codes';

const { hasOwnProperty } = Object.prototype;

/**
* Returns the camelCase counterpart of a symbol.
* @private
* @param {String} symbol The symbol.
* @return the camelCase counterpart.
*/
function toCamelCase(symbol) {
  return symbol.substring(0, 1).toLowerCase() + symbol.substring(1);
}

/**
 * A facade function that allows parameters to be passed either by name
 * (through an object), or by position (through an array).
 * @private
 * @param {Function} base The function that is being overriden. Will be
 *                        called with parameters in array-form.
 * @param {Object} defaults Parameter list and it's default values.
 * @param {*} params The parameters.
 */
function namedParamFacade(base, defaults, ...params) {
  if (params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])) {
    const valid = Object.keys(params[0]).every((key) => hasOwnProperty.call(defaults, key));
    if (valid) {
      params = Object.keys(defaults).map((key) => params[0][key] || defaults[key]);
    }
  }
  return base.apply(this, params);
}

/**
* Qix schema definition.
* @private
*/
class Schema {
  /**
  * Create a new schema instance.
  * @private
  * @param {Configuration} config The configuration for QIX.
  */
  constructor(config) {
    this.config = config;
    this.Promise = config.Promise;
    this.schema = config.schema;
    this.mixins = new KeyValueCache();
    this.types = new KeyValueCache();
  }

  registerMixin({
    types, type, extend, override, init,
  }) {
    if (!Array.isArray(types)) {
      types = [types];
    }
    // to support a single type
    if (type) {
      types.push(type);
    }
    const cached = { extend, override, init };
    types.forEach((typeKey) => {
      const entryList = this.mixins.get(typeKey);
      if (entryList) {
        entryList.push(cached);
      } else {
        this.mixins.add(typeKey, [cached]);
      }
    });
  }

  /**
  * Function used to generate a type definition.
  * @private
  * @param {String} type The type.
  * @returns {{create: Function, def: Object}} Returns an object with a definition
  *          of the type and a create factory.
  */
  generate(type) {
    const entry = this.types.get(type);
    if (entry) {
      return entry;
    }
    if (!this.schema.structs[type]) {
      throw createEnigmaError(errorCodes.SCHEMA_STRUCT_TYPE_NOT_FOUND, `${type} not found`);
    }
    const factory = this.generateApi(type, this.schema.structs[type]);
    this.types.add(type, factory);
    return factory;
  }

  /**
  * Function used to generate an API definition for a given type.
  * @private
  * @param {String} type The type to generate.
  * @param {Object} schema The schema describing the type.
  * @returns {{create: (function(session:Object, handle:Number, id:String,
  *          customKey:String)), def: Object}} Returns the API definition.
  */
  generateApi(type, schema) {
    const api = Object.create({});

    this.generateDefaultApi(api, schema); // Generate default
    this.mixinType(type, api); // Mixin default type
    this.mixinNamedParamFacade(api, schema); // Mixin named parameter support

    return function create(session, handle, id, customKey) {
      const instance = Object.create(api);

      Events.mixin(instance); // Always mixin event-emitter per instance

      Object.defineProperties(instance, {
        session: {
          enumerable: true,
          value: session,
        },
        handle: {
          enumerable: true,
          value: handle,
          writable: true,
        },
        id: {
          enumerable: true,
          value: id,
        },
        type: {
          enumerable: true,
          value: type,
        },
        genericType: {
          enumerable: true,
          value: customKey,
        },
      });

      let mixinList = this.mixins.get(type) || [];
      if (customKey !== type) {
        this.mixinType(customKey, instance); // Mixin custom types
        mixinList = mixinList.concat(this.mixins.get(customKey) || []);
      }
      mixinList.forEach((mixin) => {
        if (typeof mixin.init === 'function') {
          mixin.init({ config: this.config, api: instance });
        }
      });

      return instance;
    }.bind(this);
  }

  /**
  * Function used to generate the methods with the right handlers to the object
  * API that is being generated.
  * @private
  * @param {Object} api The object API that is currently being generated.
  * @param {Object} schema The API definition.
  */
  generateDefaultApi(api, schema) {
    Object.keys(schema).forEach((method) => {
      const out = schema[method].Out;
      const outKey = out.length === 1 ? out[0].Name : -1;
      const fnName = toCamelCase(method);

      api[fnName] = function generatedMethod(...params) {
        return this.session.send({
          handle: this.handle,
          method,
          params,
          outKey,
        });
      };
    });
  }

  /**
  * Function used to add mixin methods to a specified API.
  * @private
  * @param {String} type Used to specify which mixin should be woven in.
  * @param {Object} api The object that will be woven.
  */
  mixinType(type, api) {
    const mixinList = this.mixins.get(type);
    if (mixinList) {
      mixinList.forEach(({ extend = {}, override = {} }) => {
        Object.keys(override).forEach((key) => {
          if (typeof api[key] === 'function' && typeof override[key] === 'function') {
            const baseFn = api[key];
            api[key] = function wrappedFn(...args) {
              return override[key].apply(this, [baseFn.bind(this), ...args]);
            };
          } else {
            throw createEnigmaError(errorCodes.SCHEMA_MIXIN_CANT_OVERRIDE_FUNCTION, `No function to override. Type: ${type} function: ${key}`);
          }
        });
        Object.keys(extend).forEach((key) => {
          // handle overrides
          if (typeof api[key] === 'function' && typeof extend[key] === 'function') {
            throw createEnigmaError(errorCodes.SCHEMA_MIXIN_EXTEND_NOT_ALLOWED, `Extend is not allowed for this mixin. Type: ${type} function: ${key}`);
          } else {
            api[key] = extend[key];
          }
        });
      });
    }
  }

  /**
  * Function used to mixin the named parameter facade.
  * @private
  * @param {Object} api The object API that is currently being generated.
  * @param {Object} schema The API definition.
  */
  mixinNamedParamFacade(api, schema) {
    Object.keys(schema).forEach((key) => {
      const fnName = toCamelCase(key);
      const base = api[fnName];
      const defaults = schema[key].In.reduce((result, item) => {
        result[item.Name] = item.DefaultValue;
        return result;
      }, {});

      api[fnName] = function namedParamWrapper(...params) {
        return namedParamFacade.apply(this, [base, defaults, ...params]);
      };
    });
  }
}

export default Schema;
