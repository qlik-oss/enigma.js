import EventEmitter from './event-emitter';

import createEnigmaError from './error';
import errorCodes from './error-codes';

const RPC_CLOSE_NORMAL = 1000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

let cacheId = 0;

/**
 * The QIX Engine session object
 */
class Session {
  /**
   * Handle all JSON-RPC notification event, 'notification:*. Or handle a specific JSON-RPC
   * notification event, 'notification:OnConnected'. These events depend on the product you use QIX
   * Engine from.
   * @event Session#notification
   * @type {Object}
   * @example <caption>Bind the notification events</caption>
   * // bind all notifications to console.log:
   * session.on('notification:*', console.log);
   * // bind a specific notification to console.log:
   * session.on('notification:OnConnected', console.log);
   */

  /**
   * Handle websocket messages. Generally used in debugging purposes. `traffic:*` will handle all
   * websocket messages, `traffic:sent` will handle outgoing messages and `traffic:received` will
   * handle incoming messages.
   * @event Session#traffic
   * @type {Object}
   * @example <caption>Bind the traffic events</caption>
   * // bind both in- and outbound traffic to console.log:
   * session.on('traffic:*', console.log);
   * // bind outbound traffic to console.log:
   * session.on('traffic:sent', console.log);
   * // bind inbound traffic to console.log:
   * session.on('traffic:received', console.log);
   */

  constructor(options) {
    const session = this;
    Object.assign(session, options);
    this.Promise = this.config.Promise;
    this.definition = this.config.definition;
    EventEmitter.mixin(session);
    cacheId += 1;
    session.id = cacheId;
    session.rpc.on('socket-error', session.onRpcError.bind(session));
    session.rpc.on('closed', session.onRpcClosed.bind(session));
    session.rpc.on('message', session.onRpcMessage.bind(session));
    session.rpc.on('notification', session.onRpcNotification.bind(session));
    session.rpc.on('traffic', session.onRpcTraffic.bind(session));
    session.on('closed', () => session.onSessionClosed());
  }

  /**
  * Event handler for re-triggering error events from RPC.
  * @private
  * @emits socket-error
  * @param {Error} err Webocket error event.
  */
  onRpcError(err) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    this.emit('socket-error', err);
  }

  /**
  * Event handler for the RPC close event.
  * @private
  * @emits Session#suspended
  * @emits Session#closed
  * @param {Event} evt WebSocket close event.
  */
  onRpcClosed(evt) {
    /**
     * Handle suspended state. This event is triggered in two cases (listed below). It is useful
     * in scenarios where you for example want to block interaction in your application until you
     * are resumed again. If config.suspendOnClose is true and there was a network disconnect
     * (socked closed) or if you ran session.suspend().
     * @event Session#suspended
     * @type {Object}
     * @param {Object} evt Event object.
     * @param {String} evt.initiator String indication what triggered the suspended state. Possible
     * values network, manual.
     * @example <caption>Handling session suspended</caption>
     * session.on('suspended', () => {
     *   console.log('Session was suspended, retrying...');
     *   session.resume();
     * });
     */
    if (this.suspendResume.isSuspended) {
      return;
    }
    if (evt.code === RPC_CLOSE_NORMAL || evt.code === RPC_CLOSE_MANUAL_SUSPEND) {
      return;
    }
    if (this.config.suspendOnClose) {
      const { code, reason } = evt;
      this.suspendResume.suspend().then(() => this.emit('suspended', {
        initiator: 'network',
        code,
        reason,
      }));
    } else {
      this.emit('closed', evt);
    }
  }

  /**
  * Event handler for the RPC message event.
  * @private
  * @param {Object} response JSONRPC response.
  */
  onRpcMessage(response) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    if (response.change) {
      response.change.forEach((handle) => this.emitHandleChanged(handle));
    }
    if (response.close) {
      response.close.forEach((handle) => this.emitHandleClosed(handle));
    }
  }

  /**
  * Event handler for the RPC notification event.
  * @private
  * @emits Session#notification
  * @param {Object} response The JSONRPC notification.
  */
  onRpcNotification(response) {
    this.emit('notification:*', response.method, response.params);
    this.emit(`notification:${response.method}`, response.params);
  }

  /**
  * Event handler for the RPC traffic event.
  * @private
  * @emits Session#traffic
  * @param {String} dir The traffic direction, sent or received.
  * @param {Object} data JSONRPC request/response/WebSocket message.
  * @param {Number} handle The associated handle.
  */
  onRpcTraffic(dir, data, handle) {
    this.emit('traffic:*', dir, data);
    this.emit(`traffic:${dir}`, data);
    const api = this.apis.getApi(handle);
    if (api) {
      api.emit('traffic:*', dir, data);
      api.emit(`traffic:${dir}`, data);
    }
  }

  /**
  * Event handler for cleaning up API instances when a session has been closed.
  * @private
  * @emits API#closed
  */
  onSessionClosed() {
    this.apis.getApis().forEach((entry) => {
      entry.api.emit('closed');
      entry.api.removeAllListeners();
    });
    this.apis.clear();
  }

  /**
   * Function used to get an API for a backend object.
   * @private
   * @param {Object} args Arguments used to create object API.
   * @param {Number} args.handle Handle of the backend object.
   * @param {String} args.id ID of the backend object.
   * @param {String} args.type QIX type of the backend object. Can for example
   *                           be "Doc" or "GenericVariable".
   * @param {String} args.genericType Custom type of the backend object, if defined in qInfo.
   * @returns {Object} Returns the generated and possibly augmented API.
   */
  getObjectApi(args) {
    const {
      handle, id, type, genericType,
    } = args;
    let api = this.apis.getApi(handle);
    if (api) {
      return api;
    }
    const factory = this.definition.generate(type);
    api = factory(this, handle, id, genericType);
    this.apis.add(handle, api);
    return api;
  }

  /**
  * Establishes the websocket against the configured URL and returns the Global instance.
  * @emits Session#opened
  * @returns {Promise<Object>} Eventually resolved if the connection was successful.
  * @example <caption>Opening a sesssion</caption>
  * session.open().then(() => {
  *   console.log('Session was opened');
  * });
  */
  open() {
    /**
     * Handle opened state. This event is triggered whenever the websocket is connected and
     * ready for communication.
     * @event Session#opened
     * @type {Object}
     * @example <caption>Bind the session opened event</caption>
     * session.on('opened', () => {
     *   console.log('Session was opened');
     * });
     */
    if (!this.globalPromise) {
      const args = {
        handle: -1,
        id: 'Global',
        type: 'Global',
        genericType: 'Global',
      };
      this.globalPromise = this.rpc.open()
        .then(() => this.getObjectApi(args))
        .then((global) => {
          this.emit('opened');
          return global;
        });
    }
    return this.globalPromise;
  }

  /**
  * Function used to send data on the RPC socket.
  * @param {Object} request The request to be sent. (data and some meta info)
  * @returns {Object} Returns a promise instance.
  */
  send(request) {
    if (this.suspendResume.isSuspended) {
      return this.Promise.reject(createEnigmaError(errorCodes.SESSION_SUSPENDED, 'Session suspended'));
    }
    request.id = this.rpc.createRequestId();
    const promise = this.intercept.executeRequests(this, this.Promise.resolve(request))
      .then((augmentedRequest) => {
        const data = { ...this.config.protocol, ...augmentedRequest };
        // the outKey value is used by multiple-out interceptor, at some point
        // we need to refactor that implementation and figure out how to transport
        // this value without hijacking the JSONRPC request object:
        delete data.outKey;
        const response = this.rpc.send(data);
        augmentedRequest.retry = () => this.send(request);
        return this.intercept.executeResponses(this, response, augmentedRequest);
      });
    Session.addToPromiseChain(promise, 'requestId', request.id);
    return promise;
  }

  /**
  * Suspends the enigma.js session by closing the websocket and rejecting all method calls
  * until is has been resumed again.
  * @emits Session#suspended
  * @param {Number} [code=4000] - The reason code for suspending the connection.
  * @param {String} [reason=""] - The human readable string describing
  * why the connection is suspended.
  * @returns {Promise<Object>} Eventually resolved when the websocket has been closed.
  * @example <caption>Suspending a session</caption>
  * session.suspend().then(() => {
  *   console.log('Session was suspended');
  * });
  */
  suspend(code = 4000, reason = '') {
    return this.suspendResume.suspend(code, reason)
      .then(() => this.emit('suspended', { initiator: 'manual', code, reason }));
  }

  /**
  * Resumes a previously suspended enigma.js session by re-creating the websocket and,
  * if possible, re-open the document as well as refreshing the internal cashes. If successful,
  * changed events will be triggered on all generated APIs, and on the ones it was unable to
  * restore, the closed event will be triggered.
  * @emits Session#resumed
  * @param {Boolean} onlyIfAttached If true, resume only if the session was re-attached properly.
  * @returns {Promise<Object>} Eventually resolved when the websocket (and potentially the
  * previously opened document, and generated APIs) has been restored, rejected when it fails any
  * of those steps, or when onlyIfAttached is true and a new session was created.
  * @example <caption>Resuming a session</caption>
  * session.resume(true).then(() => {
  *   console.log('Session was resumed by re-attaching');
  * });
  */
  resume(onlyIfAttached) {
    /**
     * Handle resumed state. This event is triggered when the session was properly resumed. It is
     * useful in scenarios where you for example can close blocking modal dialogs and allow the user
     * to interact with your application again.
     * @event Session#resumed
     * @type {Object}
     * @example <caption>Handling session resumed</caption>
     * session.on('resumed', () => {
     *   console.log('Session was resumed, we can close that "reconnecting" dialog now');
     * });
     */
    return this.suspendResume.resume(onlyIfAttached).then((value) => {
      this.emit('resumed');
      return value;
    });
  }

  /**
  * Closes the websocket and cleans up internal caches, also triggers the closed event
  * on all generated APIs. Note that you have to manually invoke this when you want to
  * close a session and config.suspendOnClose is true.
  * @emits Session#closed
  * @param {Number} [code=1000] - The reason code for closing the connection.
  * @param {String} [reason=""] - The human readable string describing why the connection is closed.
  * @returns {Promise<Object>} Eventually resolved when the websocket has been closed.
  * @example <caption>Closing a session</caption>
  * session.close().then(() => {
  *   console.log('Session was closed');
  * });
  */
  close(code = 1000, reason = '') {
    /**
     * Handle closed state. This event is triggered when the underlying websocket is closed and
     * config.suspendOnClose is false.
     * @event Session#closed
     * @type {Object}
     * @example <caption>Handling session closed</caption>
     * session.on('closed', () => {
     *   console.log('Session was closed, clean up!');
     * });
     */
    this.globalPromise = undefined;
    return this.rpc.close(code, reason).then((evt) => this.emit('closed', evt));
  }

  /**
  * Given a handle, this function will emit the 'changed' event on the
  * corresponding API instance.
  * @private
  * @param {Number} handle The handle of the API instance.
  * @emits API#changed
  */
  emitHandleChanged(handle) {
    const api = this.apis.getApi(handle);
    if (api) {
      api.emit('changed');
    }
  }

  /**
  * Given a handle, this function will emit the 'closed' event on the
  * corresponding API instance.
  * @private
  * @param {Number} handle The handle of the API instance.
  * @emits API#closed
  */
  emitHandleClosed(handle) {
    const api = this.apis.getApi(handle);
    if (api) {
      api.emit('closed');
      api.removeAllListeners();
    }
  }

  /**
  * Function used to add info on the promise chain.
  * @private
  * @param {Promise<Object>} promise The promise to add info on.
  * @param {String} name The property to add info on.
  * @param {Any} value The info to add.
  */
  static addToPromiseChain(promise, name, value) {
    promise[name] = value;
    const { then } = promise;
    promise.then = function patchedThen(...params) {
      const chain = then.apply(this, params);
      Session.addToPromiseChain(chain, name, value);
      return chain;
    };
  }
}

export default Session;
