const ON_ATTACHED_TIMEOUT_MS = 5000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

class SuspendResume {
  constructor(options) {
    Object.assign(this, options);
    this.isSuspended = false;
    this.rpc.on('traffic', (dir, data) => {
      if (dir === 'sent' && data.method === 'OpenDoc') {
        this.openDocParams = data.params;
      }
    });
  }

  restoreRpcConnection(onlyIfAttached) {
    return this.reopen(ON_ATTACHED_TIMEOUT_MS).then((sessionState) => {
      if (sessionState === 'SESSION_CREATED' && onlyIfAttached) {
        return this.Promise.reject(new Error('Not attached'));
      }
      return this.Promise.resolve();
    });
  }

  restoreGlobal(changed) {
    const global = this.apis.getApisByType('Global').pop();
    changed.push(global.api);
    return this.Promise.resolve();
  }

  restoreDoc(closed, changed) {
    const doc = this.apis.getApisByType('Doc').pop();

    if (!doc) {
      return this.Promise.resolve();
    }

    return this.rpc.send({
      method: 'GetActiveDoc',
      handle: -1,
      params: [],
    }).then((response) => {
      if (response.error && this.openDocParams) {
        return this.rpc.send({
          method: 'OpenDoc',
          handle: -1,
          params: this.openDocParams,
        });
      }
      return response;
    }).then((response) => {
      if (response.error) {
        closed.push(doc.api);
        return this.Promise.resolve();
      }
      const handle = response.result.qReturn.qHandle;
      doc.api.handle = handle;
      changed.push(doc.api);
      return this.Promise.resolve(doc.api);
    });
  }

  restoreDocObjects(doc, closed, changed) {
    const tasks = [];
    const apis = this.apis.getApis()
      .map(entry => entry.api)
      .filter(api => api.type !== 'Global' && api.type !== 'Doc');

    if (!doc) {
      apis.forEach(api => closed.push(api));
      return this.Promise.resolve();
    }

    apis.forEach((api) => {
      const method = SuspendResume.buildGetMethodName(api.type);

      if (!method) {
        closed.push(api);
      } else {
        const request = this.rpc.send({
          method,
          handle: doc.handle,
          params: [api.id],
        }).then((response) => {
          if (response.error || !response.result.qReturn.qHandle) {
            closed.push(api);
          } else {
            api.handle = response.result.qReturn.qHandle;
            changed.push(api);
          }
        });
        tasks.push(request);
      }
    });
    return this.Promise.all(tasks);
  }

  suspend() {
    this.isSuspended = true;
    return this.rpc.close(RPC_CLOSE_MANUAL_SUSPEND);
  }

  resume(onlyIfAttached) {
    const changed = [];
    const closed = [];

    return this.restoreRpcConnection(onlyIfAttached)
      .then(() => this.restoreGlobal(changed))
      .then(() => this.restoreDoc(closed, changed))
      .then(doc => this.restoreDocObjects(doc, closed, changed))
      .then(() => {
        this.isSuspended = false;
        this.apis.clear();
        closed.forEach((api) => {
          api.emit('closed');
          api.removeAllListeners();
        });
        changed.forEach((api) => {
          this.apis.add(api.handle, api);
          if (api.type !== 'Global') {
            api.emit('changed');
          }
        });
      })
      .catch(err => this.rpc.close().then(() => this.Promise.reject(err)));
  }

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

    this.rpc.on('notification', onNotification);

    return this.rpc.open(true)
      .then(waitForNotification)
      .then((state) => {
        this.rpc.removeListener('notification', onNotification);
        return state;
      })
      .catch((err) => {
        this.rpc.removeListener('notification', onNotification);
        return this.Promise.reject(err);
      });
  }

  static buildGetMethodName(type) {
    if (type === 'Field' || type === 'Variable') {
      return null;
    } else if (type === 'GenericVariable') {
      return 'GetVariableById';
    }
    return type.replace('Generic', 'Get');
  }
}

export default SuspendResume;
