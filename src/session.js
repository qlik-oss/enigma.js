import EventEmitter from './event-emitter';

const RPC_CLOSE_NORMAL = 1000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

class Session {
  /**
  * Creates a new Session instance.
  * @param {Object} options The configuration option for this class.
  * @param {Intercept} options.intercept The intercept instance to use.
  * @param {ApiCache} options.apis The ApiCache instance to bridge events towards.
  * @param {Promise} options.Promise The promise constructor to use.
  * @param {RPC} options.rpc The RPC instance to use when communicating towards Engine.
  * @param {SuspendResume} options.suspendResume The SuspendResume instance to use.
  * @param {Object} [options.eventListeners] An object containing keys (event names) and
  *                                          values (event handlers) that will be bound
  *                                          during instantiation.
  */
  constructor(options) {
    const session = this;
    Object.assign(session, options);
    EventEmitter.mixin(session);
    // api cache needs a session reference:
    session.apis.session = session;
    session.rpc.on('socket-error', session.onError.bind(session));
    session.rpc.on('closed', session.onClosed.bind(session));
    session.rpc.on('message', session.onMessage.bind(session));
    session.rpc.on('notification', session.onNotification.bind(session));
    session.rpc.on('traffic', session.onTraffic.bind(session));
    session.on('handle-changed', handle => session.apis.onHandleChanged(handle));
    session.on('handle-closed', handle => session.apis.onHandleClosed(handle));
    session.on('closed', () => session.apis.onSessionClosed());
    Object.keys(session.eventListeners || {})
      .forEach(key => session.on(key, session.eventListeners[key]));
    session.emit('session-created', session);
  }

  /**
  * Event handler for re-triggering error events from RPC.
  * @emits socket-error
  * @param {Error} err Webocket error event.
  */
  onError(err) {
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
  onClosed(evt) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    if (evt.code === RPC_CLOSE_NORMAL || evt.code === RPC_CLOSE_MANUAL_SUSPEND) {
      return;
    }
    if (this.suspendOnClose) {
      this.emit('suspended', { initiator: 'network' });
    } else {
      this.emit('closed', evt);
    }
  }

  /**
  * Event handler for the RPC message event.
  * @emits handle-changed
  * @emits handle-closed
  * @param {Object} response JSONRPC response.
  */
  onMessage(response) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    if (response.change) {
      response.change.forEach(handle => this.emit('handle-changed', handle));
    }
    if (response.close) {
      response.close.forEach(handle => this.emit('handle-closed', handle));
    }
  }

  /**
  * Event handler for the RPC notification event.
  * @emits notification:*
  * @emits notification:[JSONRPC notification name]
  * @param {Object} response The JSONRPC notification.
  */
  onNotification(response) {
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
  onTraffic(dir, data) {
    this.emit('traffic:*', dir, data);
    this.emit(`traffic:${dir}`, data);
  }

  /**
  * Establishes the RPC socket connection.
  * @returns {Promise} Eventually resolved if the connection was successful.
  */
  connect() {
    return this.rpc.open();
  }

  /**
  * Function used to send data on the RPC socket.
  * @param {Object} request - The request to be sent. (data and some meta info)
  * @returns {Object} Returns a promise instance.
  */
  send(request) {
    if (this.suspendResume.isSuspended) {
      return this.Promise.reject(new Error('Session suspended'));
    }
    const data = {
      method: request.method,
      handle: request.handle,
      params: request.params,
      delta: request.delta,
    };
    const response = this.rpc.send(data);
    request.id = data.id;
    const promise = this.intercept.execute(response, request);
    Session.addToPromiseChain(promise, 'requestId', request.id);
    return promise;
  }

  /**
  * Suspends the session ("sleeping state"), and closes the RPC connection.
  * @emits suspended
  * @param {Promise} Eventually resolved when the RPC connection is closed.
  */
  suspend() {
    this.suspendResume.suspend();
    return this.rpc.close(RPC_CLOSE_MANUAL_SUSPEND)
      .then(() => this.emit('suspended', { initiator: 'manual' }));
  }

  /**
  * Resumes a previously suspended session.
  * @param {Boolean} onlyIfAttached - if true, resume only if the session was re-attached.
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
    return this.rpc.close().then(evt => this.emit('closed', evt));
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
    const then = promise.then;
    promise.then = function patchedThen(...params) {
      const chain = then.apply(this, params);
      Session.addToPromiseChain(chain, name, value);
      return chain;
    };
  }
}

export default Session;
