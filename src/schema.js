import KeyValueCache from './cache';
import Events from './event-emitter';

const { hasOwnProperty } = Object.prototype;

function toCamelCase(symbol) {
  return symbol.substring(0, 1).toLowerCase() + symbol.substring(1);
}

function namedParamFacade(base, defaults, ...params) {
  if (params.length === 1 && typeof params[0] === 'object') {
    const valid = Object.keys(params[0]).every(key => hasOwnProperty.call(defaults, key));
    if (valid) {
      params = Object.keys(defaults).map(key => params[0][key] || defaults[key]);
    }
  }
  return base.apply(this, params);
}

class Schema {
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
