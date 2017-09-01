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
  * Function used to get a session.
  * @param {Configuration} config The configuration object for this session.
  * @returns {Object} Returns a session instance.
  */
  static getSession(config) {
    const {
      createSocket,
      definition,
      JSONPatch,
      Promise,
      protocol,
      responseInterceptors,
      suspendOnClose,
      url,
    } = config;
    const apis = new ApiCache();
    const intercept = new Intercept({
      apis,
      interceptors: responseInterceptors,
      JSONPatch,
      Promise,
    });
    const rpc = new RPC({ createSocket, Promise, url });
    const suspendResume = new SuspendResume({ apis, Promise, rpc });
    const session = new Session({
      apis,
      definition,
      intercept,
      Promise,
      protocol,
      rpc,
      suspendOnClose,
      suspendResume,
    });
    return session;
  }

  /**
  * Function used to create a QIX session.
  * @param {Object} config The configuration object for the QIX session.
  * @returns {Session} Returns a new QIX session.
  */
  static create(config) {
    Qix.configureDefaults(config);
    config.mixins.forEach((mixin) => {
      config.definition.registerMixin(mixin);
    });
    return Qix.getSession(config);
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

    if (!config.Promise && typeof Promise === 'undefined') { // eslint-disable-line no-restricted-globals
      throw new Error('Your environment has no Promise implementation. You must provide a Promise implementation in the config.');
    }

    if (typeof config.createSocket !== 'function' && typeof WebSocket === 'function') {
      config.createSocket = url => new WebSocket(url); // eslint-disable-line no-undef
    }

    if (typeof config.suspendOnClose === 'undefined') {
      config.suspendOnClose = false;
    }

    config.protocol = config.protocol || {};
    config.protocol.delta = config.protocol.delta || true;
    config.Promise = config.Promise || Promise; // eslint-disable-line no-restricted-globals
    config.mixins = config.mixins || [];
    config.JSONPatch = config.JSONPatch || Patch;
    config.definition = config.definition || new Schema(config);
  }
}

export default Qix;
