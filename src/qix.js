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
      url,
      createSocket,
      protocol,
      Promise,
      responseInterceptors,
      JSONPatch,
      definition,
    } = config;
    const apis = new ApiCache();
    const rpc = new RPC({ url, createSocket, Promise });
    const suspendResume = new SuspendResume({ rpc, Promise, apis });
    const intercept = new Intercept({
      interceptors: responseInterceptors,
      JSONPatch,
      Promise,
      apis,
    });
    const session = new Session({
      Promise,
      rpc,
      suspendResume,
      intercept,
      apis,
      protocol,
      definition,
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

    if (!config.Promise && typeof Promise === 'undefined') {
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
    config.Promise = config.Promise || Promise;
    config.mixins = config.mixins || [];
    config.JSONPatch = config.JSONPatch || Patch;
    config.definition = config.definition || new Schema(config);
  }
}

export default Qix;
