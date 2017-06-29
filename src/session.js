import EventEmitter from './event-emitter';

const RPC_CLOSE_NORMAL = 1000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

class Session {
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

  onError(err) {
    if (this.suspendResume.isSuspended) {
      return;
    }
    this.emit('socket-error', err);
  }

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

  onNotification(response) {
    this.emit('notification:*', response.method, response.params);
    this.emit(`notification:${response.method}`, response.params);
  }

  onTraffic(dir, data) {
    this.emit('traffic:*', dir, data);
    this.emit(`traffic:${dir}`, data);
  }

  connect() {
    return this.rpc.open();
  }

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

  suspend() {
    this.suspendResume.suspend();
    return this.rpc.close(RPC_CLOSE_MANUAL_SUSPEND)
      .then(() => this.emit('suspended', { initiator: 'manual' }));
  }

  resume(onlyIfAttached) {
    return this.suspendResume.resume(onlyIfAttached).then((value) => {
      this.emit('resumed');
      return value;
    });
  }

  close() {
    return this.rpc.close().then(evt => this.emit('closed', evt));
  }

  /**
  * Function used to add info on the promise chain.
  * @private
  * @param {Promise} promise The promise to add info on.
  * @param {String} name    The property to add info on.
  * @param {Any} value   The info to add.
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
