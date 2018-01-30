import Events from './event-emitter';
import RPCResolver from './rpc-resolver';

class RPC {
  constructor(options) {
    Object.assign(this, options);
    Events.mixin(this);
    this.resolvers = {};
    this.requestId = 0;
    this.openedPromise = undefined;
  }

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

  onOpen() {
    this.resolvers.opened.resolveWith(() => this.closedPromise);
  }

  onClose(event) {
    this.emit('closed', event);
    this.resolvers.closed.resolveWith(event);
    this.rejectAllOutstandingResolvers({ code: -1, message: 'Socket closed' });
  }

  close(code = 1000, reason = '') {
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
    return this.closedPromise;
  }

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

  rejectAllOutstandingResolvers(reason) {
    Object.keys(this.resolvers).forEach((id) => {
      if (id === 'opened' || id === 'closed') {
        return; // "opened" and "closed" should not be handled here
      }
      const resolver = this.resolvers[id];
      resolver.rejectWith(reason);
    });
  }

  unregisterResolver(id) {
    const resolver = this.resolvers[id];
    resolver.removeAllListeners();
    delete this.resolvers[id];
  }

  registerResolver(id, resolve, reject) {
    const resolver = new RPCResolver(id, resolve, reject);
    this.resolvers[id] = resolver;
    resolver.on('resolved', resolvedId => this.unregisterResolver(resolvedId));
    resolver.on('rejected', rejectedId => this.unregisterResolver(rejectedId));
  }

  send(data) {
    if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
      return this.Promise.reject(new Error('Not connected'));
    }
    if (!data.id) {
      data.id = this.createRequestId();
    }
    data.jsonrpc = '2.0';
    return new this.Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(data));
      this.emit('traffic', 'sent', data);
      return this.registerResolver(data.id, resolve, reject);
    });
  }

  createRequestId() {
    this.requestId += 1;
    return this.requestId;
  }
}

export default RPC;
