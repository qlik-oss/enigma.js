import EventEmitter from './event-emitter';

const RPC_CLOSE_NORMAL = 1000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

let cacheId = 0;

class Session {
  /**
  * Creates a new Session instance.
  * @param {Object} options The configuration option for this class.
  * @param {ApiCache} options.apis The ApiCache instance to bridge events towards.
  * @param {Object} options.config The configuration object for this session.
  * @param {Intercept} options.intercept The intercept instance to use.
  * @param {RPC} options.rpc The RPC instance to use when communicating towards Engine.
  * @param {SuspendResume} options.suspendResume The SuspendResume instance to use.
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
  * @emits suspended
  * @emits closed
  * @param {Event} evt WebSocket close event.
  */
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

  /**
  * Event handler for the RPC message event.
  * @param {Object} response JSONRPC response.
  */
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

  /**
  * Event handler for the RPC notification event.
  * @emits notification:*
  * @emits notification:[JSONRPC notification name]
  * @param {Object} response The JSONRPC notification.
  */
  onRpcNotification(response) {
    this.emit('notification:*', response.method, response.params);
    this.emit(`notification:${response.method}`, response.params);
  }

  /**
  * Event handler for the RPC traffic event.
  * @emits traffic:*
  * @emits traffic:sent
  * @emits traffic:received
  * @param {String} dir The traffic direction, sent or received.
  * @param {Object} data JSONRPC request/response/WebSocket message.
  */
  onRpcTraffic(dir, data) {
    this.emit('traffic:*', dir, data);
    this.emit(`traffic:${dir}`, data);
  }

  /**
  * Event handler for cleaning up API instances when a session has been closed.
  * @emits api#closed
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
   * @param {Object} args Arguments used to create object API.
   * @param {Number} args.handle Handle of the backend object.
   * @param {String} args.id ID of the backend object.
   * @param {String} args.type QIX type of the backend object. Can for example
   *                           be "Doc" or "GenericVariable".
   * @param {String} args.genericType Custom type of the backend object, if defined in qInfo.
   * @returns {*} Returns the generated and possibly augmented API.
   */
  getObjectApi(args) {
    const {
      handle, id, type, genericType,
    } = args;
    let api = this.apis.getApi(handle);
    if (api) {
      return api;
    }
    api = this.definition
      .generate(type)
      .create(this, handle, id, genericType);
    this.apis.add(handle, api);
    return api;
  }

  /**
  * Establishes the RPC socket connection and returns the Global instance.
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
  * @param {Object} request The request to be sent. (data and some meta info)
  * @returns {Object} Returns a promise instance.
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
  * @emits suspended
  * @returns {Promise} Eventually resolved when the RPC connection is closed.
  */
  suspend() {
    return this.suspendResume.suspend()
      .then(() => this.emit('suspended', { initiator: 'manual' }));
  }

  /**
  * Resumes a previously suspended session.
  * @param {Boolean} onlyIfAttached If true, resume only if the session was re-attached.
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
  * @returns {Promise} Eventually resolved when the RPC connection is closed.
  */
  close() {
    this.globalPromise = undefined;
    return this.rpc.close().then(evt => this.emit('closed', evt));
  }

  /**
  * Given a handle, this function will emit the 'changed' event on the
  * corresponding API instance.
  * @param {Number} handle The handle of the API instance.
  * @emits api#changed
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
  * @param {Number} handle The handle of the API instance.
  * @emits api#closed
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
  * @param {Promise} promise The promise to add info on.
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
