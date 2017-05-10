import Events from '../../event-emitter';
import RPCResolver from './rpc-resolver';

/**
* This class handles remote procedure calls on a web socket.
*/
class RPC {

  /**
  * Create a new RPC instance.
  * @param {Function} Promise - The promise constructor.
  * @param {String} url - The URL used to connect to an endpoint.
  * @param {Function} createSocket The function callback to create a WebSocket.
  * @param {Object} sessionConfig - The object to configure the session.
  */
  constructor(Promise, url, createSocket, sessionConfig) {
    Events.mixin(this);
    this.Promise = Promise;
    this.url = url;
    this.createSocket = createSocket;
    this.sessionConfig = sessionConfig;
    this.resolvers = {};
    this.requestId = 0;
    this.openedPromise = undefined;
  }

  /**
  * Opens a connection to the configured endpoint.
  * @param {Boolean} force - ignores all previous and outstanding open calls if set to true.
  * @returns {Object} A promise instance.
  */
  open(force = false) {
    if (!force && this.openedPromise) {
      return this.openedPromise;
    }

    try {
      this.socket = this.createSocket(this.url, this.sessionConfig);
    } catch (err) {
      return this.Promise.reject(err);
    }

    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.openedPromise = new this.Promise((resolve, reject) => this.registerResolver('opened', resolve, reject));
    this.closedPromise = new this.Promise((resolve, reject) => this.registerResolver('closed', resolve, reject));
    return this.openedPromise;
  }

  /**
  * Reopens the connection and waits for the OnConnected notification.
  * @param {Number} timeout - The time to wait for the OnConnected notification.
  * @returns {Object} A promise containing the session state (SESSION_CREATED or SESSION_ATTACHED).
  */
  reopen(timeout) {
    let timer;
    let resolver;
    const waitForNotification = new this.Promise((resolve) => { resolver = resolve; });

    const onNotification = (data) => {
      if (data.method !== 'OnConnected') return;
      clearTimeout(timer);
      resolver(data.params.qConnectedState);
    };

    const onTimeout = () => {
      resolver('SESSION_CREATED');
    };

    const cleanUpAndReturn = (obj, func) => {
      this.removeListener('notification', onNotification);
      return func(obj);
    };

    this.on('notification', onNotification);
    return this.open(true)
      .then(() => { timer = setTimeout(onTimeout, timeout); })
      .then(() => waitForNotification)
      .then(state => cleanUpAndReturn(state, this.Promise.resolve))
      .catch(err => cleanUpAndReturn(err, this.Promise.reject));
  }

  /**
  * Resolves the open promise when a connection is successfully established.
  */
  onOpen() {
    this.resolvers.opened.resolveWith(
      () => this.closedPromise
    );
  }

  /**
  * Resolves the close promise when a connection is closed.
  * @param {Object} event - The event describing close.
  */
  onClose(event) {
    this.emit('closed', event);
    this.resolvers.closed.resolveWith(event);
    this.rejectAllOutstandingResolvers();
  }

  /**
  * Closes a connection.
  * @param {Number} [code=1000] - The reason code for closing the connection.
  * @param {String} [reason=""] - The human readable string describing why the connection is closed.
  * @returns {Object} Returns a promise instance.
  */
  close(code = 1000, reason = '') {
    this.socket.close(code, reason);
    return this.closedPromise;
  }

  /**
  * Emits an error event and rejects the open promise if an error is raised on the connection.
  * @param {Object} event - The event describing the error.
  */
  onError(event) {
    if (this.resolvers.opened) {
      this.resolvers.opened.rejectWith(event);
    } else {
      // only emit errors after the initial open promise has been resolved,
      // this makes it possible to catch early websocket errors as well
      // as run-time ones:
      this.emit('socket-error', event);
    }
    this.rejectAllOutstandingResolvers();
  }

  /**
  * Parses the onMessage event on the connection and resolve the promise for the request.
  * @param {Object} event - The event describing the message.
  */
  onMessage(event) {
    const data = JSON.parse(event.data);
    if (typeof data.id !== 'undefined') {
      this.emit('message', data);
      this.resolvers[data.id].resolveWith(data);
    } else {
      this.emit(data.params ? 'notification' : 'message', data);
    }
  }

  /**
  * Rejects all outstanding resolvers.
  */
  rejectAllOutstandingResolvers() {
    Object.keys(this.resolvers).forEach((id) => {
      if (id === 'opened' || id === 'closed') {
        return; // "opened" and "closed" should not be handled here
      }
      const resolver = this.resolvers[id];
      resolver.rejectWith();
    });
  }

  /**
  * Unregisters a resolver.
  * @param {Number|String} id - The ID to unregister the resolver with.
  */
  unregisterResolver(id) {
    const resolver = this.resolvers[id];
    resolver.removeAllListeners();
    delete this.resolvers[id];
  }

  /**
  * Registers a resolver.
  * @param {Number|String} id - The ID to register the resolver with.
  * @returns {Function} The promise executor function.
  */
  registerResolver(id, resolve, reject) {
    const resolver = this.resolvers[id] = new RPCResolver(id, resolve, reject);
    resolver.on('resolved', resolvedId => this.unregisterResolver(resolvedId));
    resolver.on('rejected', rejectedId => this.unregisterResolver(rejectedId));
  }

  /**
  * Sends data on the socket.
  * @param {Object} data - The data to send.
  * @returns {Object} A promise instance.
  */
  send(data) {
    if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
      return this.Promise.reject(new Error('Not connected'));
    }
    data.jsonrpc = '2.0';
    data.id = this.requestId += 1;
    return new this.Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(data));
      return this.registerResolver(data.id, resolve, reject);
    });
  }
}

export default RPC;
