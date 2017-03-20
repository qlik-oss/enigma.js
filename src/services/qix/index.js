import Patch from '../../json-patch';
import Session from './session';
import Schema from './schema';
import RPC from './rpc';
import KeyValueCache from '../../cache';

function replaceLeadingAndTrailingSlashes(str) {
  return str.replace(/(^[/]+)|([/]+$)/g, '');
}

/**
* The configuration object for how to connect and retrieve end QIX APIs.
* @typedef {Object} Configuration
* @property {Function} Promise The promise constructor.
* @property {Function} createSocket A function to use when instantiating the WebSocket.
*                                   Mandatory for NodeJS.
* @property {Object} schema The JSON object describing the api.
* @property {String} [appId] The app id. If omitted, only the global object is returned.
*                            Otherwise both global and app object are returned.
* @property {Boolean} [delta=true] The flag to enable/disable delta handling.
* @property {Object} [mixins=[]] An array of mixins.
* @property {SessionConfiguration} The session configuration object.
*/

/**
* The session configuration object.
* @typedef {Object} SessionConfiguration
* @property {Boolean} [unsecure=false] Set to true if an unsecure WebSocket should be used.
* @property {String} [host] Host address.
* @property {Number} [port] Port to connect to.
* @property {String} [prefix="/"] The absolute base path to use when connecting.
*                             Used for proxy prefixes.
* @property {String} [subpath=""] The subpath.
* @property {String} [route=""] Used to instruct Proxy to route to the correct receiver.
* @property {String} [identity=""] Identity to use.
* @property {String} [reloadURI=""] The reloadURI.
* @property {String} [disableCache=false] Set to true if you want a new Session.
*/

/**
* Qix service.
*/
export default class Qix {

  /**
  * @description Create an instance of the Qix service.
  */
  constructor() {
    this.sessions = new KeyValueCache();
  }

  /**
  * Function used to create a session.
  * @param {Object} rpc The RPC instance used by the session.
  * @param {Boolean} delta=true Flag to determine delta handling.
  * @param {Object} schema The Definition used by the session.
  * @param {Object} JSONPatch JSON patch object.
  * @param {Function} Promise The promise constructor.
  * @param {Object} listeners A key-value map of listeners.
  * @param {Array} interceptors An array of interceptors.
  * @param {Function} log handler callback
  * @returns {Object} Returns an instance of Session.
  */
  createSession(rpc, delta, schema, JSONPatch, Promise, listeners, interceptors, handleLog) {
    return new Session(rpc, delta, schema, JSONPatch, Promise, listeners, interceptors, handleLog);
  }

  /**
  * Function used to create an RPC.
  * @param {Function} Promise The promise constructor.
  * @param {String} url The URL used to connect to an endpoint.
  * @param {Function} createSocket The function callback to create a WebSocket.
  * @param {SessionConfiguration} sessionConfig - The session configuration object.
  * @returns {Object} Returns an instance of RPC.
  */
  createRPC(Promise, url, createSocket, sessionConfig) {
    return new RPC(Promise, url, createSocket, sessionConfig);
  }

  /**
  * Function used to build an URL.
  * @param {SessionConfiguration} sessionConfig - The session configuration object.
  * @param {String} [appId] The optional app id.
  * @returns {String} Returns the URL.
  */
  buildUrl(sessionConfig, appId) {
    const { unsecure, host, port, prefix, subpath, route, identity, reloadURI } = sessionConfig;
    let url = '';

    url += `${unsecure ? 'ws' : 'wss'}://`;
    url += host || 'localhost';

    if (port) {
      url += `:${port}`;
    }

    if (prefix) {
      url += `/${replaceLeadingAndTrailingSlashes(prefix)}`;
    }

    if (subpath) {
      url += `/${replaceLeadingAndTrailingSlashes(subpath)}`;
    }

    if (route) {
      url += `/${replaceLeadingAndTrailingSlashes(route)}`;
    } else if (appId && appId !== '') {
      url += `/app/${encodeURIComponent(appId)}`;
    }

    if (identity) {
      url += `/identity/${encodeURIComponent(identity)}`;
    }

    if (reloadURI) {
      url += `?reloadUri=${encodeURIComponent(reloadURI)}`;
    }

    return url;
  }

  /**
  * Function used to get a session.
  * @param {Object} config The object to configure the session.
  * @param {Boolean} [config.delta=true] The flag to enable/disable delta handling.
  * @param {Object} config.schema - The Schema definition used by the session.
  * @param {Object} config.session The session configuration.
  * @param {Function} config.Promise The promise constructor.
  * @returns {Object} Returns a session instance.
  */
  getSession(config) {
    const url = this.buildUrl(config.session, config.appId);
    const { disableCache } = config.session;

    let session = !disableCache && this.sessions.get(url);
    if (!session) {
      const rpc = this.createRPC(config.Promise, url, config.createSocket, config.session);
      session = this.createSession(
        rpc,
        config.delta,
        config.schema,
        config.JSONPatch,
        config.Promise,
        config.listeners,
        config.responseInterceptors,
        config.handleLog
      );
      if (!disableCache) {
        this.sessions.add(url, session);
        session.on('closed', () => this.sessions.remove(url));
      }
    }
    return session;
  }

  /**
  * Function used to get the global API.
  * @param {Object} session The session to get the global on.
  * @param {Configuration} config The configuration object for how to connect and
  *                               retrieve end QIX APIs.
  * @returns {Promise<Object>} Returns a promise of an instance for the global API.
  */
  getGlobal(session, config) {
    return session.connect().then(() => {
      const args = { handle: -1, id: 'Global', type: 'Global', customType: 'Global', delta: config.delta };
      const globalApi = session.getObjectApi(args);
      globalApi.openApp = globalApi.openDoc = (appId, user = '', password = '', serial = '', noData = false) => {
        config.session.route = '';
        config.appId = appId;

        const appSession = this.getSession(config);

        if (!appSession.apiPromise) {
          appSession.apiPromise = appSession.connect().then(() =>
            appSession.send({
              method: 'OpenDoc',
              handle: -1,
              params: [appId, user, password, serial, !!noData],
              delta: false,
              outKey: -1,
            })
          );
        }

        return appSession.apiPromise;
      };
      return globalApi;
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
  get(session, config) {
    return this.getGlobal(session, config).then((g) => {
      if (config.appId) {
        return g.openApp(
          config.appId,
          config.user,
          config.password,
          config.serial,
          config.noData
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
  connect(config) {
    Qix.configureDefaults(config);
    config.mixins.forEach((mixin) => {
      config.schema.registerMixin(mixin);
    });
    const session = this.getSession(config);
    return this.get(session, config);
  }

  /**
  * Function used to configure defaults.
  * @param {Configuration} config The configuration object for how to connect
  *                               and retrieve end QIX APIs.
  */
  static configureDefaults(config) {
    if (!config.Promise && typeof Promise === 'undefined') {
      throw new Error('Your environment has no Promise implementation. You must provide a Promise implementation in the config.');
    }
    config.Promise = config.Promise || Promise;
    config.session = config.session || {};
    if (!config.session.host) {
      if (typeof location !== 'undefined' && typeof location.hostname === 'string') { // eslint-disable-line no-undef
        config.session.host = location.hostname; // eslint-disable-line no-undef
      } else {
        config.session.host = 'localhost';
      }
    }
    if (!config.appId && !config.session.route) {
      config.session.route = 'app/engineData';
    }
    if (typeof config.createSocket !== 'function' && typeof WebSocket === 'function') {
      config.createSocket = url => new WebSocket(url); // eslint-disable-line no-undef
    }
    if (!(config.schema instanceof Schema)) {
      config.schema = new Schema(config.Promise, config.schema);
    }
    config.mixins = config.mixins || [];
    config.JSONPatch = config.JSONPatch || Patch;
  }
}
