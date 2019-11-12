import createEnigmaError from './error';
import errorCodes from './error-codes';

const ON_ATTACHED_TIMEOUT_MS = 5000;
const RPC_CLOSE_MANUAL_SUSPEND = 4000;

class SuspendResume {
  /**
  * Creates a new SuspendResume instance.
  * @private
  * @param {Object} options The configuration option for this class.
  * @param {Promise<Object>} options.Promise The promise constructor to use.
  * @param {RPC} options.rpc The RPC instance to use when communicating towards Engine.
  * @param {ApiCache} options.apis The ApiCache instance to use.
  */
  constructor(options) {
    Object.assign(this, options);
    this.isSuspended = false;
    this.rpc.on('traffic', (dir, data) => {
      if (dir === 'sent' && data.method === 'OpenDoc') {
        this.openDocParams = data.params;
      }
    });
  }

  /**
  * Function used to restore the rpc connection.
  * @private
  * @param {Boolean} onlyIfAttached - if true, the returned promise will resolve
  *                                   only if the session can be re-attached.
  * @returns {Object} Returns a promise instance.
  */
  restoreRpcConnection(onlyIfAttached) {
    return this.reopen(ON_ATTACHED_TIMEOUT_MS).then((sessionState) => {
      if (sessionState === 'SESSION_CREATED' && onlyIfAttached) {
        return this.Promise.reject(createEnigmaError(errorCodes.SESSION_NOT_ATTACHED, 'Not attached'));
      }
      return this.Promise.resolve();
    });
  }

  /**
  * Function used to restore the global API.
  * @private
  * @param {Object} changed - A list where the restored APIs will be added.
  * @returns {Object} Returns a promise instance.
  */
  restoreGlobal(changed) {
    const global = this.apis.getApisByType('Global').pop();
    changed.push(global.api);
    return this.Promise.resolve();
  }

  /**
  * Function used to restore the doc API.
  * @private
  * @param {String} sessionState - The state of the session, attached or created.
  * @param {Array} closed - A list where the closed of APIs APIs will be added.
  * @param {Object} changed - A list where the restored APIs will be added.
  * @returns {Object} Returns a promise instance.
  */
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

  /**
  * Function used to restore the APIs on the doc.
  * @private
  * @param {Object} doc - The doc API on which the APIs we want to restore exist.
  * @param {Array} closed - A list where the closed of APIs APIs will be added.
  * @param {Object} changed - A list where the restored APIs will be added.
  * @returns {Object} Returns a promise instance.
  */
  restoreDocObjects(doc, closed, changed) {
    const tasks = [];
    const apis = this.apis.getApis()
      .map((entry) => entry.api)
      .filter((api) => api.type !== 'Global' && api.type !== 'Doc');

    if (!doc) {
      apis.forEach((api) => closed.push(api));
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

  /**
  * Set the instance as suspended.
  * @private
  * @param {Number} [code=4000] - The reason code for suspending the connection.
  * @param {String} [reason=""] - The human readable string describing
  * why the connection is suspended.
  */
  suspend(code = RPC_CLOSE_MANUAL_SUSPEND, reason = '') {
    this.isSuspended = true;
    return this.rpc.close(code, reason);
  }

  /**
  * Resumes a previously suspended RPC connection, and refreshes the API cache.
  *                                APIs unabled to be restored has their 'closed'
  *                                event triggered, otherwise 'changed'.
  * @private
  * @emits API#changed
  * @emits APIfunction@#closed
  * @param {Boolean} onlyIfAttached if true, resume only if the session was re-attached.
  * @returns {Promise<Object>} Eventually resolved if the RPC connection was successfully resumed,
  *                    otherwise rejected.
  */
  resume(onlyIfAttached) {
    const changed = [];
    const closed = [];

    return this.restoreRpcConnection(onlyIfAttached)
      .then(() => this.restoreGlobal(changed))
      .then(() => this.restoreDoc(closed, changed))
      .then((doc) => this.restoreDocObjects(doc, closed, changed))
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
      .catch((err) => this.rpc.close().then(() => this.Promise.reject(err)));
  }

  /**
  * Reopens the connection and waits for the OnConnected notification.
  * @private
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

  /**
  * Function used to build the get method names for Doc APIs.
  * @private
  * @param {String} type - The API type.
  * @returns {String} Returns the get method name, or undefined if the type cannot be restored.
  */
  static buildGetMethodName(type) {
    if (type === 'Field' || type === 'Variable') {
      return null;
    }
    if (type === 'GenericVariable') {
      return 'GetVariableById';
    }
    return type.replace('Generic', 'Get');
  }
}

export default SuspendResume;
