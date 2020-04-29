import QueryString from 'querystring';

/**
* This object describes the configuration that is sent into `buildUrl(config)`.
* @typedef {Object} SenseConfiguration
* @property {String} [appId] The app id. If omitted, only the global object is returned.
*                            Otherwise both global and app object are returned.
* @property {Boolean} [noData=false] Whether to open the app without data.
* @property {Boolean} [secure=true] Set to false if an unsecure WebSocket should be used.
* @property {String} [host] Host address.
* @property {Number} [port] Port to connect to.
* @property {String} [prefix="/"] The absolute base path to use when connecting.
*                             Used for proxy prefixes.
* @property {String} [subpath=""] The subpath.
* @property {String} [route=""] Used to instruct Proxy to route to the correct receiver.
* @property {String} [identity=""] Identity to use.
* @property {Object} [urlParams={}] Used to add parameters to the WebSocket URL.
* @property {Number} [ttl] A value in seconds that QIX Engine should keep the session
*                             alive after socket disconnect (only works if QIX Engine supports it).
*/

function replaceLeadingAndTrailingSlashes(str) {
  return str.replace(/(^[/]+)|([/]+$)/g, '');
}

class SenseUtilities {
  /**
  * Ensures that the configuration has defaults set.
  *
  * @private
  * @param {SenseConfiguration} senseConfig The configuration to ensure defaults on.
  */
  static configureDefaults(senseConfig) {
    if (!senseConfig.host) {
      senseConfig.host = 'localhost';
    }

    if (typeof senseConfig.secure === 'undefined') {
      senseConfig.secure = true;
    }

    if (!senseConfig.appId && !senseConfig.route) {
      senseConfig.route = 'app/engineData';
    }

    if (typeof senseConfig.noData === 'undefined') {
      senseConfig.noData = false;
    }
  }

  /**
  * Function used to build an URL.
  * @entry
  * @param {SenseConfiguration} urlConfig - The URL configuration object.
  * @returns {String} Returns the websocket URL.
  * @example <caption>Example of building and using a Qlik Sense-compatible WebSocket URL</caption>
  * const enigma = require('enigma.js');
  * const schema = require('enigma.js/schemas/12.20.0.json');
  * const SenseUtilities = require('enigma.js/sense-utilities');
  * const url = SenseUtilities.buildUrl({ host: 'my-sense-host', appId: 'some-app' });
  * const session = enigma.create({ schema, url });
  */
  static buildUrl(urlConfig) {
    SenseUtilities.configureDefaults(urlConfig);

    const {
      secure,
      host,
      port,
      prefix,
      subpath,
      route,
      identity,
      urlParams,
      ttl,
      appId,
    } = urlConfig;

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
    } else if (appId) {
      url += `/app/${encodeURIComponent(appId)}`;
    }

    if (identity) {
      url += `/identity/${encodeURIComponent(identity)}`;
    }

    if (ttl) {
      url += `/ttl/${ttl}`;
    }

    if (urlParams) {
      url += `?${QueryString.stringify(urlParams)}`;
    }

    return url;
  }
}

export default SenseUtilities;
