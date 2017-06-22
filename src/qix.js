import QueryString from 'querystring';
import Patch from './json-patch';
import Session from './session';
import Schema from './schema';
import RPC from './rpc';

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
* @property {Boolean} [secure=true] Set to false if an unsecure WebSocket should be used.
* @property {Boolean} [unsecure=false] Set to true if an unsecure WebSocket should be used.
                              DEPRECATED owing to the secure property.
* @property {String} [host] Host address.
* @property {Number} [port] Port to connect to.
* @property {String} [prefix="/"] The absolute base path to use when connecting.
*                             Used for proxy prefixes.
* @property {String} [subpath=""] The subpath.
* @property {String} [route=""] Used to instruct Proxy to route to the correct receiver.
* @property {String} [identity=""] Identity to use.
* @property {String} [reloadURI=""] The reloadURI.
*                             DEPRECATED owing to the urlParams property.
* @property {Object} [urlParams={}] Used to add parameters to the WebSocket URL.
* @property {Boolean} [suspendOnClose=false] Set to true if the session should be suspended
*                             and not closed if the WebSocket is closed unexpectedly.
* @property {Number} [ttl] A value in seconds that QIX Engine should keep the session
*                             alive after socket disconnect (only works if QIX Engine supports it).
*/

/**
* Qix service.
*/
class Qix {

  /**
  * Function used to build an URL.
  * @param {SessionConfiguration} sessionConfig - The session configuration object.
  * @param {String} [appId] The optional app id.
  * @returns {String} Returns the URL.
  */
  static buildUrl(sessionConfig, appId) {
    const { secure, host, port, prefix, subpath, route, identity,
      reloadURI, urlParams, ttl } = sessionConfig;
    let url = '';

    url += `${secure ? 'wss' : 'ws'}://`;
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

    if (ttl) {
      url += `/ttl/${ttl}`;
    }

    if (reloadURI) {
      if (!urlParams || !urlParams.reloadUri) {
        url += `?reloadUri=${encodeURIComponent(reloadURI)}`;
      }
    }

    if (urlParams) {
      url += `?${QueryString.stringify(urlParams)}`;
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
  static getSession(config) {
    const url = Qix.buildUrl(config.session, config.appId);
    const rpc = new RPC(config.Promise, url, config.createSocket, config.session);
    const session = new Session(
        rpc,
        config.delta,
        config.schema,
        config.JSONPatch,
        config.Promise,
        config.listeners,
        config.responseInterceptors,
        config.session.suspendOnClose
      );
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
      const globalApi = session.getObjectApi(args);
      globalApi.openApp = globalApi.openDoc =
      (appId, user = '', password = '', serial = '', noData = false) => {
        config.session.route = '';
        config.appId = appId;

        const appSession = Qix.getSession(config);

        if (!appSession.apiPromise) {
          // create a Global API for this session:
          appSession.getObjectApi(args);
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
  static get(session, config) {
    return Qix.getGlobal(session, config).then((g) => {
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
  static connect(config) {
    Qix.configureDefaults(config);
    config.mixins.forEach((mixin) => {
      config.schema.registerMixin(mixin);
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

    config.Promise = config.Promise || Promise;
    config.session = config.session || {};

    if (!config.session.host) {
      if (typeof location !== 'undefined' && typeof location.hostname === 'string') { // eslint-disable-line no-undef
        config.session.host = location.hostname; // eslint-disable-line no-undef
      } else {
        config.session.host = 'localhost';
      }
    }

    if (typeof config.session.secure === 'undefined') {
      config.session.secure = !config.session.unsecure;
    }

    if (typeof config.session.suspendOnClose === 'undefined') {
      config.session.suspendOnClose = false;
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

export default Qix;
