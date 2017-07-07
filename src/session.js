import EventEmitter from './event-emitter';

const RPC_CLOSE_NORMAL = 1000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

const NOTIFICATION = 'notification';
const NOTIFICATION_PREFIX = `${NOTIFICATION}:`;
const TRAFFIC = 'traffic';
const TRAFFIC_PREFIX = `${TRAFFIC}:`;

const Events = {
  OPENED: 'opened',
  CLOSED: 'closed',
  SUSPENDED: 'suspended',
  HANDLE_CHANGED: 'handle-changed',
  HANDLE_CLOSED: 'handle-closed',
  SOCKET_ERROR: 'socket-error',
  MESSAGE: 'message',
  NOTIFICATION,
  NOTIFICATION_STAR: `${NOTIFICATION_PREFIX}*`,
  TRAFFIC,
  TRAFFIC_STAR: `${TRAFFIC_PREFIX}*`,
};

class Session {
  /**
  * Creates a new Session instance.
  * @param {Object} options The configuration option for this class.
  * @param {Intercept} options.intercept The intercept instance to use.
  * @param {ApiCache} options.apis The ApiCache instance to bridge events towards.
  * @param {Promise} options.Promise The promise constructor to use.
  * @param {RPC} options.rpc The RPC instance to use when communicating towards Engine.
  * @param {Schema} options.definition The Schema instance to use when generating APIs.
  * @param {Object} options.protocol Additional protocol properties.
  * @param {Boolean} options.protocol.delta Flag indicating if delta should be used or not.
  * @param {SuspendResume} options.suspendResume The SuspendResume instance to use.
  * @param {Object} [options.eventListeners] An object containing keys (event names) and
  *                                          values (event handlers) that will be bound
  *                                          during instantiation.
  */
  constructor(options) {
    const session = this;
    Object.assign(session, options);
    EventEmitter.mixin(session);
    session.rpc.on(Events.SOCKET_ERROR, session.onError.bind(session));
    session.rpc.on(Events.CLOSED, session.onClosed.bind(session));
    session.rpc.on(Events.MESSAGE, session.onMessage.bind(session));
    session.rpc.on(Events.NOTIFICATION, session.onNotification.bind(session));
    session.rpc.on(Events.TRAFFIC, session.onTraffic.bind(session));
    session.on(Events.HANDLE_CHANGED, handle => session.apis.onHandleChanged(handle));
    session.on(Events.HANDLE_CLOSED, handle => session.apis.onHandleClosed(handle));
    session.on(Events.CLOSED, () => session.apis.onSessionClosed());
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
      this.suspendResume.suspend().then(() => this.emit(Events.SUSPENDED, { initiator: 'network' }));
    } else {
      this.emit(Events.CLOSED, evt);
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
      response.change.forEach(handle => this.emit(Events.HANDLE_CHANGED, handle));
    }
    if (response.close) {
      response.close.forEach(handle => this.emit(Events.HANDLE_CLOSED, handle));
    }
  }

  /**
  * Event handler for the RPC notification event.
  * @emits notification:*
  * @emits notification:[JSONRPC notification name]
  * @param {Object} response The JSONRPC notification.
  */
  onNotification(response) {
    this.emit(Events.NOTIFICATION_STAR, response.method, response.params);
    this.emit(`${NOTIFICATION_PREFIX}${response.method}`, response.params);
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
    this.emit(Events.TRAFFIC_STAR, dir, data);
    this.emit(`${TRAFFIC_PREFIX}${dir}`, data);
  }

  /**
  * Function used to get an API for a backend object.
  * @param {Object} args Arguments used to create object API.
  * @param {Number} args.handle Handle of the backend object.
  * @param {String} args.id ID of the backend object.
  * @param {String} args.type QIX type of the backend object. Can for example
  *                           be "Doc" or "GenericVariable".
  * @param {String} args.customType Custom type of the backend object, if defined in qInfo.
  * @returns {*} Returns the generated and possibly augmented API.
  */
  getObjectApi(args) {
    const { handle, id, type, customType } = args;
    let api = this.apis.getApi(handle);
    if (api) {
      return api;
    }
    api = this.definition
      .generate(type)
      .create(this, handle, id, this.protocol.delta, customType);
    this.apis.add(handle, api);
    return api;
  }

  /**
  * Response handler for generating APIs. Handles the quirks of engine not returning an error
  * when an object is missing.
  * @param {Object} response The response message.
  * @returns {Promise} A promise that resolves with the created object.
  */
  handleObjectReferenceResponse(response) {
    if (response.qHandle && response.qType) {
      return this.getObjectApi({
        handle: response.qHandle,
        type: response.qType,
        id: response.qGenericId,
        customType: response.qGenericType,
      });
    }
    return this.Promise.reject(new Error('Object not found'));
  }

  /**
  * Establishes the RPC socket connection and returns the Global instance.
  * @returns {Promise} Eventually resolved if the connection was successful.
  */
  open() {
    if (!this.globalPromise) {
      const args = { handle: -1, id: 'Global', type: 'Global', customType: 'Global' };
      this.globalPromise = this.rpc.open()
        .then(() => this.getObjectApi(args))
        .then((global) => {
          this.emit(Events.OPENED);
          return global;
        });
    }
    return this.globalPromise;
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
    const data = Object.assign({}, this.protocol, {
      method: request.method,
      handle: request.handle,
      params: request.params,
      delta: request.delta,
    });
    const response = this.rpc.send(data);
    request.id = data.id;

    const promise = this.intercept.execute(response, request).then((res) => {
      if (typeof res.qHandle !== 'undefined' && typeof res.qType !== 'undefined') {
        return this.handleObjectReferenceResponse(res);
      }
      return res;
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
      .then(() => this.emit(Events.SUSPENDED, { initiator: 'manual' }));
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
    this.globalPromise = undefined;
    return this.rpc.close().then(evt => this.emit(Events.CLOSED, evt));
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
