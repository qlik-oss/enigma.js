import Events from './event-emitter';
import RPCResolver from './rpc-resolver';

import createEnigmaError from './error';
import errorCodes from './error-codes';

/**
* This class handles remote procedure calls on a web socket.
* @private
*/
class RPC {
  /**
  * Create a new RPC instance.
  * @private
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
    this.closeEvent = undefined;
  }

  /**
  * Opens a connection to the configured endpoint.
  * @private
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
    this.openedPromise = new this.Promise((resolve, reject) => this.registerResolver('opened', null, resolve, reject));
    this.closedPromise = new this.Promise((resolve, reject) => this.registerResolver('closed', null, resolve, reject));
    return this.openedPromise;
  }

  /**
  * Resolves the open promise when a connection is successfully established.
  * @private
  */
  onOpen() {
    this.resolvers.opened.resolveWith(() => this.closedPromise);
  }

  /**
  * Resolves the close promise when a connection is closed.
  * @private
  * @param {Object} event - The event describing close.
  */
  onClose(event) {
    this.emit('closed', event);
    this.closeEvent = event;
    if (this.resolvers && this.resolvers.closed) {
      this.resolvers.closed.resolveWith(event);
    }
    this.rejectAllOutstandingResolvers(createEnigmaError(errorCodes.NOT_CONNECTED, 'Socket closed', event));
  }

  /**
  * Closes a connection.
  * @private
  * @param {Number} [code=1000] - The reason code for closing the connection.
  * @param {String} [reason=""] - The human readable string describing why the connection is closed.
  * @returns {Object} Returns a promise instance.
  */
  close(code = 1000, reason = '') {
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
    return this.closedPromise;
  }

  /**
  * Emits an error event and rejects the open promise if an error is raised on the connection.
  * @private
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
    this.rejectAllOutstandingResolvers(createEnigmaError(errorCodes.NOT_CONNECTED, 'Socket error', event));
  }

  /**
  * Parses the onMessage event on the connection and resolve the promise for the request.
  * @private
  * @param {Object} event - The event describing the message.
  */
  onMessage(event) {
    const data = JSON.parse(event.data);
    const resolver = this.resolvers[data.id] || {};
    this.emit('traffic', 'received', data, resolver.handle);
    if (typeof data.id !== 'undefined' && this.resolvers[data.id]) {
      this.emit('message', data);
      this.resolvers[data.id].resolveWith(data);
    } else {
      this.emit(data.params ? 'notification' : 'message', data);
    }
  }

  /**
  * Rejects all outstanding resolvers.
  * @private
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
  * @private
  * @param {Number|String} id - The ID to unregister the resolver with.
  */
  unregisterResolver(id) {
    const resolver = this.resolvers[id];
    resolver.removeAllListeners();
    delete this.resolvers[id];
  }

  /**
  * Registers a resolver.
  * @private
  * @param {Number|String} id - The ID to register the resolver with.
  * @param {Number} handle - The associated handle.
  * @returns {Function} The promise executor function.
  */
  registerResolver(id, handle, resolve, reject) {
    const resolver = new RPCResolver(id, handle, resolve, reject);
    this.resolvers[id] = resolver;
    resolver.on('resolved', (resolvedId) => this.unregisterResolver(resolvedId));
    resolver.on('rejected', (rejectedId) => this.unregisterResolver(rejectedId));
  }

  /**
  * Sends data on the socket.
  * @private
  * @param {Object} data - The data to send.
  * @returns {Object} A promise instance.
  */
  send(data) {
    if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
      const error = createEnigmaError(errorCodes.NOT_CONNECTED, 'Not connected', this.closeEvent);
      return this.Promise.reject(error);
    }
    if (!data.id) {
      data.id = this.createRequestId();
    }
    data.jsonrpc = '2.0';
    return new this.Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(data));
      this.emit('traffic', 'sent', data, data.handle);
      return this.registerResolver(data.id, data.handle, resolve, reject);
    });
  }

  createRequestId() {
    this.requestId += 1;
    return this.requestId;
  }
}

export default RPC;
