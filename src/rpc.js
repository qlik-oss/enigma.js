import Events from './event-emitter';
import RPCResolver from './rpc-resolver';

/**
* This class handles remote procedure calls on a web socket.
*/
class RPC {
  /**
  * Create a new RPC instance.
  * @param {Object} options The configuration options for this class.
  * @param {Function} options.Promise The promise constructor to use.
  * @param {String} options.url The complete websocket URL used to connect.
  * @param {Function} options.createSocket The function callback to create a WebSocket.
  */
  constructor(options) {
    Object.assign(this, options);
    Events.mixin(this);
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
      this.socket = this.createSocket(this.url);
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
    let notificationResolve;
    let notificationReceived = false;
    const notificationPromise = new this.Promise((resolve) => { notificationResolve = resolve; });

    const waitForNotification = () => {
      if (!notificationReceived) {
        timer = setTimeout(() => notificationResolve('SESSION_CREATED'), timeout);
      }
      return notificationPromise;
    };

    const onNotification = (data) => {
      if (data.method !== 'OnConnected') return;
      clearTimeout(timer);
      notificationResolve(data.params.qSessionState);
      notificationReceived = true;
    };

    this.on('notification', onNotification);

    return this.open(true)
      .then(waitForNotification)
      .then((state) => {
        this.removeListener('notification', onNotification);
        return state;
      })
      .catch((err) => {
        this.removeListener('notification', onNotification);
        return this.Promise.reject(err);
      });
  }

  /**
  * Resolves the open promise when a connection is successfully established.
  */
  onOpen() {
    this.resolvers.opened.resolveWith(
      () => this.closedPromise,
    );
  }

  /**
  * Resolves the close promise when a connection is closed.
  * @param {Object} event - The event describing close.
  */
  onClose(event) {
    this.emit('closed', event);
    this.resolvers.closed.resolveWith(event);
    this.rejectAllOutstandingResolvers({ code: -1, message: 'Socket closed' });
  }

  /**
  * Closes a connection.
  * @param {Number} [code=1000] - The reason code for closing the connection.
  * @param {String} [reason=""] - The human readable string describing why the connection is closed.
  * @returns {Object} Returns a promise instance.
  */
  close(code = 1000, reason = '') {
    this.socket.close(code, reason);
    this.socket = null;
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
    this.rejectAllOutstandingResolvers({ code: -1, message: 'Socket error' });
  }

  /**
  * Parses the onMessage event on the connection and resolve the promise for the request.
  * @param {Object} event - The event describing the message.
  */
  onMessage(event) {
    const data = JSON.parse(event.data);
    this.emit('traffic', 'received', data);
    if (typeof data.id !== 'undefined') {
      this.emit('message', data);
      this.resolvers[data.id].resolveWith(data);
    } else {
      this.emit(data.params ? 'notification' : 'message', data);
    }
  }

  /**
  * Rejects all outstanding resolvers.
  * @param {Object} reason - The reject reason.
  */
  rejectAllOutstandingResolvers(reason) {
    Object.keys(this.resolvers).forEach((id) => {
      if (id === 'opened' || id === 'closed') {
        return; // "opened" and "closed" should not be handled here
      }
      const resolver = this.resolvers[id];
      resolver.rejectWith(reason);
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
    const resolver = new RPCResolver(id, resolve, reject);
    this.resolvers[id] = resolver;
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
    this.requestId += 1;
    data.jsonrpc = '2.0';
    data.id = this.requestId;
    return new this.Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(data));
      this.emit('traffic', 'sent', data);
      return this.registerResolver(data.id, resolve, reject);
    });
  }
}

export default RPC;
