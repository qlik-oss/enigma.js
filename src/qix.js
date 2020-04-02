import Session from './session';
import Schema from './schema';
import RPC from './rpc';
import SuspendResume from './suspend-resume';
import Intercept from './intercept';
import ApiCache from './api-cache';

import createEnigmaError from './error';
import errorCodes from './error-codes';

/**
 * The enigma.js configuration object.
 * @interface Configuration
 * @property {Object} schema Object containing the specification for the API to generate.
 * Corresponds to a specific version of the QIX Engine API.
 * @property {String} url String containing a proper websocker URL to QIX Engine.
 * @property {Function} [createSocket] A function to use when instantiating the WebSocket,
 * mandatory for Node.js.
 * @property {Object} [Promise] ES6-compatible Promise library.
 * @property {Boolean} [suspendOnClose=false] Set to true if the session should be suspended
 * instead of closed when the websocket is closed.
 * @property {Array<Mixin>} [mixins=[]] Mixins to extend/augment the QIX Engine API. Mixins
 * are applied in the array order.
 * @property {Array} [requestInterceptors=[]] Interceptors for augmenting requests before they
 * are sent to QIX Engine. Interceptors are applied in the array order.
 * @property {Array} [responseInterceptors=[]] Interceptors for augmenting responses before they
 * are passed into mixins and end-users. Interceptors are applied in the array order.
 * @property {Object} [protocol={}] An object containing additional JSON-RPC request parameters.
 * @property {Boolean} [protocol.delta=true] Set to false to disable the use of the
 * bandwidth-reducing delta protocol.
 * @example <caption>Example defining a configuration object</caption>
 * const enigma = require('enigma.js');
 * const WebSocket = require('ws');
 * const bluebird = require('bluebird');
 * const schema = require('enigma.js/schemas/12.20.0.json');
 *
 * const config = {
 *  schema,
 *  url: 'ws://localhost:4848/app/engineData',
 *  createSocket: url => new WebSocket(url),
 *  Promise: bluebird,
 *  suspendOnClose: true,
 *  mixins: [{ types: ['Global'], init: () => console.log('Mixin ran') }],
 *  protocol: { delta: false },
 * };
 *
 * enigma.create(config).open().then((global) => {
 *   // global === QIX global interface
 *   process.exit(0);
 * });
 */

/**
 * The mixin concept allows you to add or override QIX Engine API functionality. A mixin is
 * basically a JavaScript object describing which types it modifies, and a list of functions
 * for extending and overriding the API for those types.
 *
 * QIX Engine types like for example GenericObject, Doc, GenericBookmark, are supported but
 * also custom GenericObject types such as barchart, story and myCustomType. An API will get
 * both their generic type as well as custom type mixins applied.
 *
 * Mixins that are bound to several different types can find the current API type in the
 * `genericType` or `type` members. `this.type` would for instance return `GenericObject` and
 * `this.genericType` would return `barchart`.
 *
 * See the Mixins examples on how to use it, below is an outline of what the mixin API consists of.
 *
 * @interface Mixin
 * @property {String|Array<String>} types String or array of strings containing the API-types that
 * will be mixed in.
 * @property {Object} [extend] Object literal containing the methods that will be extended on the
 * specified API.
 * @property {Object} [override] Object literal containing the methods to override existing methods.
 * @property {Function} [init] Init function that, if defined, will run when an API is instantiated.
 * It runs with Promise and API object as parameters
 */

/**
 * The API for generated APIs depends on the QIX Engine schema you pass into your Configuration, and
 * on what QIX struct the API has.
 *
 * All API calls made using the generated APIs will return promises which are either resolved or
 * rejected depending on how the QIX Engine responds.
 *
 * @interface API
 * @property {String} id Contains the unique identifier for this API.
 * @property {String} type Contains the schema class name for this API.
 * @property {String} genericType Corresponds to the qInfo.qType property on the generic object's
 * properties object.
 * @property {Session} session Contains a reference to the session that this API belongs to.
 * @property {Number} handle Contains the handle QIX Engine assigned to the API. Used interally in
 * enigma.js for caches and JSON-RPC requests.
 * @example <caption>Example using `global` and `generic object` struct APIs</caption>
 * global.openDoc('my-document.qvf').then((doc) => {
 *   doc.createObject({ qInfo: { qType: 'my-object' } }).then(api => { });
 *   doc.getObject('object-id').then(api => { });
 *   doc.getBookmark('bookmark-id').then(api => { });
 * });
 */

/**
 * Handle changes on the API. The changed event is triggered whenever enigma.js or QIX Engine has
 * identified potential changes on the underlying properties or hypercubes and you should re-fetch
 * your data.
 * @event API#changed
 * @type {Object}
 * @example <caption>Bind the `changed` event</caption>
 * api.on('changed', () => {
 *   api.getLayout().then(layout => { });
 * });
 */

/**
 * Handle closed API. The closed event is triggered whenever QIX Engine considers an API closed.
 * It usually means that it no longer exist in the QIX Engine document or session.
 * @event API#closed
 * @type {Object}
 * @example <caption>Bind the `closed` event</caption>
 * api.on('closed', () => {
 *   console.log(api.id, 'was closed');
 * });
 */

/**
 * Handle JSON-RPC requests/responses for this API. Generally used in debugging purposes.
 * `traffic:*` will handle all websocket messages, `traffic:sent` will handle outgoing messages
 * and `traffic:received` will handle incoming messages.
 * @event API#traffic
 * @type {Object}
 * @example <caption>Bind the traffic events</caption>
 * // bind both in- and outbound traffic to console.log:
 * api.on('traffic:*', console.log);
 * // bind outbound traffic to console.log:
 * api.on('traffic:sent', console.log);
 * // bind inbound traffic to console.log:
 * api.on('traffic:received', console.log);
 */

/**
* Qix service.
*/
class Qix {
  /**
  * Function used to get a session.
  * @private
  * @param {Configuration} config The configuration object for this session.
  * @returns {Session} Returns a session instance.
  */
  static getSession(config) {
    const {
      createSocket,
      Promise,
      requestInterceptors,
      responseInterceptors,
      url,
    } = config;
    const apis = new ApiCache();
    const intercept = new Intercept({
      apis,
      Promise,
      request: requestInterceptors,
      response: responseInterceptors,
    });
    const rpc = new RPC({ createSocket, Promise, url });
    const suspendResume = new SuspendResume({ apis, Promise, rpc });
    const session = new Session({
      apis,
      config,
      intercept,
      rpc,
      suspendResume,
    });
    return session;
  }

  /**
  * Function used to create a QIX session.
  * @param {Configuration} config The configuration object for the QIX session.
  * @returns {Session} Returns a new QIX session.
  * @example <caption>Example minimal session creation</caption>
  * const enigma = require('enigma.js');
  * const schema = require('enigma.js/schemas/12.20.0.json');
  * const WebSocket = require('ws');
  * const config = {
  *   schema,
  *   url: 'ws://localhost:9076/app/engineData',
  *   createSocket: url => new WebSocket(url),
  * };
  * const session = enigma.create(config);
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
  * @private
  * @param {Configuration} config The configuration object for how to connect
  *                               and retrieve end QIX APIs.
  */
  static configureDefaults(config) {
    if (!config) {
      throw createEnigmaError(errorCodes.NO_CONFIG_SUPPLIED, 'You need to supply a configuration.');
    }

    // eslint-disable-next-line no-restricted-globals
    if (!config.Promise && typeof Promise === 'undefined') {
      throw createEnigmaError(errorCodes.PROMISE_REQUIRED, 'Your environment has no Promise implementation. You must provide a Promise implementation in the config.');
    }

    if (typeof config.createSocket !== 'function' && typeof WebSocket === 'function') {
      // eslint-disable-next-line no-undef
      config.createSocket = (url) => new WebSocket(url);
    }

    if (typeof config.suspendOnClose === 'undefined') {
      config.suspendOnClose = false;
    }

    config.protocol = config.protocol || {};
    config.protocol.delta = typeof config.protocol.delta !== 'undefined' ? config.protocol.delta : true;
    // eslint-disable-next-line no-restricted-globals
    config.Promise = config.Promise || Promise;
    config.mixins = config.mixins || [];
    config.definition = config.definition || new Schema(config);
  }
}

export default Qix;
