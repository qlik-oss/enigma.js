import QueryString from 'querystring';

/**
* The Qlik Sense configuration object.
* @typedef {object} SenseConfiguration
* @property {string} [appId] The app id. If omitted, only the global object is returned.
*                            Otherwise both global and app object are returned.
* @property {boolean} [noData=false] Whether to open the app without data.
* @property {boolean} [secure=true] Set to false if an unsecure WebSocket should be used.
* @property {string} [host] Host address.
* @property {Number} [port] Port to connect to.
* @property {string} [prefix="/"] The absolute base path to use when connecting.
*                             Used for proxy prefixes.
* @property {string} [subpath=""] The subpath.
* @property {string} [route=""] Used to instruct Proxy to route to the correct receiver.
* @property {string} [identity=""] Identity to use.
* @property {object} [urlParams={}] Used to add parameters to the WebSocket URL.
* @property {Number} [ttl] A value in seconds that QIX Engine should keep the session
*                             alive after socket disconnect (only works if QIX Engine supports it).
*/

function replaceLeadingAndTrailingSlashes(str) {
  return str.replace(/(^[/]+)|([/]+$)/g, '');
}


const SenseUtilities = {
  configureDefaults(senseConfig) {
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
  },

  /**
  * Function used to build an URL.
  * @param {SenseConfiguration} urlConfig The URL configuration object.
  * @returns {string} Returns the URL.
  */
  buildUrl(urlConfig) {
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
    } else if (appId && appId !== '') {
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
  },
};

export default SenseUtilities;
