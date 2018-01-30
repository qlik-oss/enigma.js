import EventEmitter from './event-emitter';

const RPC_CLOSE_NORMAL = 1000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

let cacheId = 0;

/**
 * @typedef {object} SuspendedEventData
 * @param {string} initiator Indicating what caused the suspended state,
 *                           either 'network' or 'manual'.
 */

/**
 * Emitted when the session was opened.
 * @event Session#opened
 */

/**
 * Emitted when the underlying websocket got an error.
 * @event Session#socket-error
 * @param {Event} evt WebSocket error event.
 */

/**
 * Emitted when the session was suspended.
 * @event Session#suspended
 * @param {SuspendedEventData} data The suspended event meta data.
 */

/**
 * Emitted when the session was resumed.
 * @event Session#resumed
 */

/**
 * Emitted when the session was closed.
 * @event Session#closed
 * @param {Event} evt WebSocket closed event.
 */

/**
 * Emitted when a JSON-RPC notification was received.
 * @event Session#notification:*
 * @param {string} name The notification name.
 * @param {object} notification The notification data.
 */

/**
 * Emitted when a specific JSON-RPC notification was received.
 * This event is templated, you need to supply the notification
 * name. Example: notification:OnConnected.
 * @event Session#notification:<name>
 * @param {object} notification The notification data.
 */

/**
 * Emitted when the session had traffic sent or received.
 * @event Session#traffic:*
 * @param {string} direction The traffic direction, either 'sent' or 'received'.
 * @param {object} payload The traffic payload.
 */

/**
 * Emitted when the session sent traffic.
 * @event Session#traffic:sent
 * @param {object} payload The traffic payload.
 */

/**
* Emitted when the session received traffic.
* @event Session#traffic:received
* @param {object} payload The traffic payload.
*/

/**
 * Represents an enigma.js session, not to be confused with a QIX Engine
 * session. The difference being that one QIX Engine session may have multiple
 * enigma.js sessions across multiple Node.js and browser processes.
 */
class Session {
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

  onRpcError(evt) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    this.emit('socket-error', evt);
  }

  onRpcClosed(evt) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    if (evt.code === RPC_CLOSE_NORMAL || evt.code === RPC_CLOSE_MANUAL_SUSPEND) {
      return;
    }
    if (this.config.suspendOnClose) {
      this.suspendResume.suspend().then(() => this.emit('suspended', { initiator: 'network' }));
    } else {
      this.emit('closed', evt);
    }
  }

  onRpcMessage(response) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    if (response.change) {
      response.change.forEach(handle => this.emitHandleChanged(handle));
    }
    if (response.close) {
      response.close.forEach(handle => this.emitHandleClosed(handle));
    }
  }

  onRpcNotification(response) {
    this.emit('notification:*', response.method, response.params);
    this.emit(`notification:${response.method}`, response.params);
  }

  onRpcTraffic(dir, data) {
    this.emit('traffic:*', dir, data);
    this.emit(`traffic:${dir}`, data);
  }

  onSessionClosed() {
    this.apis.getApis().forEach((entry) => {
      entry.api.emit('closed');
      entry.api.removeAllListeners();
    });
    this.apis.clear();
  }

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
  * Establishes the RPC socket connection and returns the Global instance.
  * @emits Session#opened
  * @returns {Promise} Eventually resolved if the connection was successful.
  */
  open() {
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
  * @param {object} request The request to be sent. (data and some meta info)
  * @returns {Promise} Eventually resolved or rejected when a response was received.
  */
  send(request) {
    if (this.suspendResume.isSuspended) {
      return this.Promise.reject(new Error('Session suspended'));
    }
    request.id = this.rpc.createRequestId();
    const promise = this.intercept.executeRequests(this, this.Promise.resolve(request))
      .then((augmentedRequest) => {
        const data = Object.assign({}, this.config.protocol, augmentedRequest);
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
  * Suspends the session ("sleeping state"), and closes the RPC connection.
  * @emits Session#suspended
  * @returns {Promise} Eventually resolved when the RPC connection is closed.
  */
  suspend() {
    return this.suspendResume.suspend()
      .then(() => this.emit('suspended', { initiator: 'manual' }));
  }

  /**
  * Resumes a previously suspended session.
  * @emits Session#resumed
  * @param {boolean} onlyIfAttached If true, resume only if the session was re-attached.
  * @returns {Promise} Eventually resolved if the session was successfully resumed,
  *                    otherwise rejected.
  */
  resume(onlyIfAttached) {
    return this.suspendResume.resume(onlyIfAttached).then((value) => {
      this.emit('resumed');
      return value;
    });
  }

  /**
  * Function used to close the session.
  * @emits Session#closed
  * @returns {Promise} Eventually resolved when the RPC connection is closed.
  */
  close() {
    this.globalPromise = undefined;
    return this.rpc.close().then(evt => this.emit('closed', evt));
  }

  emitHandleChanged(handle) {
    const api = this.apis.getApi(handle);
    if (api) {
      api.emit('changed');
    }
  }

  emitHandleClosed(handle) {
    const api = this.apis.getApi(handle);
    if (api) {
      api.emit('closed');
      api.removeAllListeners();
    }
  }

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
