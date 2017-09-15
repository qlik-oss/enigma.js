import KeyValueCache from './cache';
import Events from './event-emitter';

const IGNORE_DELTA_METHODS = [
  'GetProperties',
  'SetProperties',
  'GetFullPropertyTree',
  'SetFullPropertyTree',
  'GetAppProperties',
  'SetAppProperties',
];

const SUCCESS_KEY = 'qSuccess';

const { hasOwnProperty } = Object.prototype;

/**
* Returns the camelCase counterpart of a symbol.
* @param {String} symbol The symbol.
* @return the camelCase counterpart.
*/
function toCamelCase(symbol) {
  return symbol.substring(0, 1).toLowerCase() + symbol.substring(1);
}

/**
 * A facade function that allows parameters to be passed either by name
 * (through an object), or by position (through an array).
 * @param {Function} base The function that is being overriden. Will be
 *                        called with parameters in array-form.
 * @param {Object} defaults Parameter list and it's default values.
 * @param {*} params The parameters.
 */
function namedParamFacade(base, defaults, ...params) {
  if (params.length === 1 && typeof params[0] === 'object') {
    const valid = Object.keys(params[0]).every(key => hasOwnProperty.call(defaults, key));
    if (valid) {
      params = Object.keys(defaults).map(key => params[0][key] || defaults[key]);
    }
  }
  return base.apply(this, params);
}

/**
* Qix schema definition.
*/
class Schema {
  /**
  * Create a new schema instance.
  * @param {Configuration} config The configuration for QIX.
  */
  constructor(config) {
    this.config = config;
    this.Promise = config.Promise;
    this.schema = config.schema;
    this.mixins = new KeyValueCache();
    this.types = new KeyValueCache();
  }

  /**
  * Function used to add a mixin object to the mixin cache. Will be mixed into the API
  * of the specified key when generated.
  * @param {Object} mixin Mixin object.
  * @param {String|Array<String>} mixin.types String or array of strings containing the
  *                                           API-types that will be mixed in.
  * @param {Object} [mixin.extend] Object literal containing the methods that
  *                                will be extended on the specified API.
  * @param {Object} [mixin.override] Object literal containing the methods to
  *                                  override existing methods.
  * @param {Function} [mixin.init] Init function that, if defined, will run when an API is
  *                                instantiated. It runs with Promise and API object as parameters.
  */
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
      throw new Error(`${type} not found`);
    }
    const factory = this.generateApi(type, this.schema.structs[type]);
    this.types.add(type, factory);
    return factory;
  }

  /**
  * Function used to generate an API definition for a given type.
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

    const create = function create(session, handle, id, customKey) {
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

    return {
      create,
      def: api,
    };
  }

  /**
  * Function used to generate the methods with the right handlers to the object
  * API that is being generated.
  * @param {Object} api The object API that is currently being generated.
  * @param {Object} schema The API definition.
  */
  generateDefaultApi(api, schema) {
    Object.keys(schema).forEach((key) => {
      const fnName = toCamelCase(key);
      const outKey = schema[key].Out && schema[key].Out.length === 1 ? schema[key].Out[0].Name : -1;
      const allowDelta = this.config.protocol.delta &&
        IGNORE_DELTA_METHODS.indexOf(key) === -1 &&
        outKey !== -1 &&
        outKey !== SUCCESS_KEY;

      function fn(...params) {
        return this.session.send({
          method: key,
          handle: this.handle,
          params,
          delta: allowDelta,
          outKey,
        });
      }

      Object.defineProperty(api, fnName, {
        enumerable: true,
        writable: true,
        value: fn,
      });
    });
  }

  /**
  * Function used to add mixin methods to a specified API.
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
            throw new Error(`No function to override. Type: ${type} function: ${key}`);
          }
        });
        Object.keys(extend).forEach((key) => {
          // handle overrides
          if (typeof api[key] === 'function' && typeof extend[key] === 'function') {
            throw new Error(`Extend is not allowed for this mixin. Type: ${type} function: ${key}`);
          } else {
            api[key] = extend[key];
          }
        });
      });
    }
  }

  /**
  * Function used to mixin the named parameter facade.
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
