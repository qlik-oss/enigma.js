import KeyValueCache from '../../cache';
import Events from '../../event-emitter';

const IGNORE_DELTA_METHODS = [
  'GetProperties',
  'SetProperties',
  'GetFullPropertyTree',
  'SetFullPropertyTree',
  'GetAppProperties',
  'SetAppProperties',
];

const SUCCESS_KEY = 'qSuccess';

/**
* Qix schema definition.
*/
class Schema {

  /**
  * Create a new schema instance.
  * @param {Function} Promise The constructor function for a promise.
  * @param {Object} json The JSON object that describes the API.
  */
  constructor(Promise, json) {
    this.Promise = Promise;
    this.mixins = new KeyValueCache();
    this.def = json;
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
  registerMixin({ types, type, extend, override, init }) {
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
  * @param {String} typeKey The type.
  * @returns {{create: Function, def: Object}} Returns an object with a definition
  *          of the type and a create factory.
  */
  generate(typeKey) {
    const entry = this.types.get(typeKey);
    if (entry) {
      return entry;
    }
    if (!this.def.structs[typeKey]) {
      throw new Error(`${typeKey} not found`);
    }
    const type = this.generateApi(typeKey, this.def.structs[typeKey]);
    this.types.add(typeKey, type);
    return type;
  }

  /**
  * Function used to generate an API definition for a given type.
  * @param {String} typeKey The type to generate.
  * @param {Object} def The API definition.
  * @returns {{create: (function(session:Object, handle:Number, id:String,
  *          delta:Boolean, customKey:String)), def: Object}} Returns the API definition.
  */
  generateApi(typeKey, def) {
    const typeDef = Object.create({});

    this.generateDefaultApi(typeDef, def); // Generate default
    this.mixinType(typeKey, typeDef); // Mixin default type

    const create = function create(session, handle, id, delta, customKey) {
      const api = Object.create(typeDef);

      Events.mixin(api); // Always mixin event-emitter per instance

      Object.defineProperties(api, {
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
        delta: {
          enumerable: true,
          value: delta,
        },
        type: {
          enumerable: true,
          value: typeKey,
        },
        genericType: {
          enumerable: true,
          value: customKey,
        },
      });

      let mixinList = this.mixins.get(typeKey) || [];
      if (customKey !== typeKey) {
        this.mixinType(customKey, api); // Mixin custom types
        mixinList = mixinList.concat(this.mixins.get(customKey) || []);
      }
      mixinList.forEach((mixin) => {
        if (typeof mixin.init === 'function') {
          mixin.init({ Promise: this.Promise, api });
        }
      });

      return api;
    }.bind(this);

    return {
      create,
      def: typeDef,
    };
  }

  /**
  * Function used to generate the methods with the right handlers to the object
  * API that is being generated.
  * @param {Object} typeDef The object API that is currently being generated.
  * @param {Object} def The API definition.
  */
  generateDefaultApi(typeDef, def) {
    Object.keys(def).forEach((key) => {
      const fnName = key.substring(0, 1).toLowerCase() + key.substring(1);
      const outKey = def[key].Out && def[key].Out.length === 1 ? def[key].Out[0].Name : -1;

      const allowDelta = IGNORE_DELTA_METHODS.indexOf(key) === -1 &&
        outKey !== -1 &&
        outKey !== SUCCESS_KEY;

      function fn(...params) {
        return this.session.send({
          method: key,
          handle: this.handle,
          params,
          delta: this.delta && allowDelta,
          outKey,
        });
      }

      Object.defineProperty(typeDef, fnName, {
        enumerable: true,
        writable: true,
        value: fn,
      });
    });
  }

  /**
  * Function used to add mixin methods to a specified API.
  * @param {String} typeKey Used to specify which mixin should be woven in.
  * @param {Object} api The object that will be woven.
  */
  mixinType(typeKey, api) {
    const mixinList = this.mixins.get(typeKey);
    if (mixinList) {
      mixinList.forEach(({ extend = {}, override = {} }) => {
        Object.keys(override).forEach((key) => {
          if (typeof api[key] === 'function' && typeof override[key] === 'function') {
            const baseFn = api[key];
            api[key] = function wrappedFn(...args) {
              return override[key].apply(this, [baseFn.bind(this), ...args]);
            };
          } else {
            throw new Error(`No function to override. Type: ${typeKey} function: ${key}`);
          }
        });
        Object.keys(extend).forEach((key) => {
          // handle overrides
          if (typeof api[key] === 'function' && typeof extend[key] === 'function') {
            throw new Error(`Extend is not allowed for this mixin. Type: ${typeKey} function: ${key}`);
          } else {
            api[key] = extend[key];
          }
        });
      });
    }
  }
}

export default Schema;
