import Patch from './json-patch';
import Session from './session';
import Schema from './schema';
import RPC from './rpc';
import SuspendResume from './suspend-resume';
import Intercept from './intercept';
import ApiCache from './api-cache';

/**
* Qix service.
*/
class Qix {
  /**
  * The configuration object for how to connect and retrieve end QIX APIs.
  * @typedef {Object} Configuration
  * @property {Function} createSocket A function to use when instantiating the WebSocket.
  *                                   Mandatory for NodeJS.
  * @property {Object} schema The JSON object describing the API.
  * @property {Promise} [Promise] The promise constructor to use.
  * @property {Boolean} [suspendOnClose=false] Set to true if the session should be suspended
  *                             and not closed if the WebSocket is closed unexpectedly.
  * @property {String} [appId] The app id. If omitted, only the global object is returned.
  *                            Otherwise both global and app object are returned.
  * @property {Boolean} [noData=false] Whether to open the app without data.
  * @property {Boolean} [delta=true] The flag to enable/disable delta handling.
  * @property {Object} [mixins=[]] An array of mixins.
  * @param {Object} [listeners={}] An object with event listeners to bind.
  * @param {Array} [responseInterceptors=[]] A list of interceptors to use.
  */

  /**
  * Function used to get a session.
  * @param {Configuration} config The configuration object for this session.
  * @returns {Object} Returns a session instance.
  */
  static getSession(config) {
    const {
      url,
      listeners,
      createSocket,
      delta,
      Promise,
      responseInterceptors,
      JSONPatch,
      definition,
    } = config;
    const apis = new ApiCache({ Promise, definition });
    const rpc = new RPC({ url, createSocket, delta, Promise });
    const suspendResume = new SuspendResume({ rpc, Promise, apis });
    const intercept = new Intercept({
      interceptors: responseInterceptors,
      JSONPatch,
      Promise,
      delta,
      apis,
    });
    const session = new Session({
      Promise,
      rpc,
      suspendResume,
      intercept,
      apis,
      // 'listeners' is a function from EventEmitter which is mixed into session,
      // so we map it to a property we own:
      eventListeners: listeners,
    });
    return session;
  }

  /**
  * Function used to get the global API.
  * @param {Object} session The session to get the global on.
  * @param {Configuration} config The configuration object for how to connect and
  *                               retrieve end QIX APIs.
  * @returns {Promise<Object>} Returns a promise of an instance for the global API.
  */
  static getGlobal(session, config) {
    return session.connect().then(() => {
      const args = { handle: -1, id: 'Global', type: 'Global', customType: 'Global', delta: config.delta };
      return session.apis.getObjectApi(args);
    }).catch((err) => {
      session.emit('closed', err);
      throw err;
    });
  }

  /**
  * Function used to get the global API and optionally the app.
  * @param {Object} session The session to get the global on.
  * @param {Configuration} config The object to configure.
  * @returns {Promise} Returns a promise of a global API or an object
  *                    containing the global API and the app API.
  */
  static get(session, config) {
    return Qix.getGlobal(session, config).then((g) => {
      if (config.appId) {
        return g.openDoc(
          config.appId,
          config.user || '',
          config.password || '',
          config.serial || '',
          config.noData || false
        ).then(app => ({ global: g, app }));
      }
      return {
        global: g,
      };
    });
  }

  /**
  * Function used to connect to QIX and return the global API and an optional app API.
  * @param {Configuration} config The configuration object for how to connect and
  *                               retrieve end QIX APIs.
  * @returns {Promise<Object>} Returns a promise containing an instance for the
  *                            global API if resolved. If unresolved, an error will be thrown.
  */
  static connect(config) {
    Qix.configureDefaults(config);
    config.mixins.forEach((mixin) => {
      config.definition.registerMixin(mixin);
    });
    const session = Qix.getSession(config);
    return Qix.get(session, config);
  }

  /**
  * Function used to configure defaults.
  * @param {Configuration} config The configuration object for how to connect
  *                               and retrieve end QIX APIs.
  */
  static configureDefaults(config) {
    if (!config) {
      throw new Error('You need to supply a configuration.');
    }

    if (!config.Promise && typeof Promise === 'undefined') {
      throw new Error('Your environment has no Promise implementation. You must provide a Promise implementation in the config.');
    }

    if (typeof config.createSocket !== 'function' && typeof WebSocket === 'function') {
      config.createSocket = url => new WebSocket(url); // eslint-disable-line no-undef
    }

    if (typeof config.suspendOnClose === 'undefined') {
      config.suspendOnClose = false;
    }

    config.Promise = config.Promise || Promise;
    config.mixins = config.mixins || [];
    config.JSONPatch = config.JSONPatch || Patch;
    config.definition = config.definition || new Schema(config);
  }
}

export default Qix;
