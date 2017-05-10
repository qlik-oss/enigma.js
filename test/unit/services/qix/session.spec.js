import Promise from 'bluebird';
import Session from '../../../../src/services/qix/session';
import RPCMock from '../../../mocks/rpc-mock';
import SocketMock from '../../../mocks/socket-mock';
import ApiCache from '../../../../src/services/qix/api-cache';

describe('Session', () => {
  let session;
  let sandbox;
  const definition = {
    generate: sinon.stub().returnsThis(),
    create: sinon.stub().returnsArg(1),
  };
  const JSONPatchMock = { apply() {} };
  const createSession = (throwError, rpc, listeners) => {
    session = new Session(
      rpc || new RPCMock(Promise, 'http://localhost:4848', url =>
      new SocketMock(url, throwError)
    ),
    true,
    definition,
    JSONPatchMock,
    Promise,
    listeners);
  };

  beforeEach(() => {
    createSession();
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should be a constructor', () => {
    expect(Session).to.be.a('function');
    expect(Session).to.throw();
  });

  it('should set instance variables', () => {
    expect(session.rpc).to.be.an.instanceOf(RPCMock);
    expect(session.delta).to.equal(true);
    expect(session.apis).to.be.an.instanceOf(ApiCache);
    expect(session.JSONPatch).to.equal(JSONPatchMock);
    expect(session.Promise).to.equal(Promise);
    expect(session.definition).to.equal(definition);
  });

  it('should return a promise when connect is called', () => {
    const connect = session.connect();
    expect(connect).to.be.an.instanceOf(Promise);
    expect(session.connect()).to.equal(connect);
  });

  it("should call reject callback if connection can't be established", (done) => {
    createSession(true);
    session.connect().then(() => {}, () => { done(); });
  });

  it("should call catch reject callback if connection can't be established", (done) => {
    createSession(true);
    session.connect().catch(() => { done(); });
  });

  describe('listeners', () => {
    it('should call notification listeners', () => {
      const spy = sandbox.spy();
      const listeners = {
        'notification:Foo': spy,
      };
      createSession(false, null, listeners);
      session.emit('notification:Foo', { prop: 'foo' });
      expect(spy).to.have.been.calledWithExactly({ prop: 'foo' });
    });
  });

  describe('send', () => {
    it("should throw when trying to send a message if connection isn't established", () => {
      expect(session.send).to.throw();
    });

    it('should call `addToPromiseChain` for `requestId`', () => {
      const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
      createSession(false, rpc);
      sinon.stub(rpc, 'send', (data) => {
        data.id = 1;
        return Promise.resolve(data);
      });

      sandbox.stub(session, 'intercept').returns(Promise.resolve({}));
      const fn = sandbox.stub(Session, 'addToPromiseChain');
      const request = {};
      return session.send(request).then(() => {
        expect(request).to.have.property('id', 1);
        expect(fn).to.have.been.calledWithExactly(sinon.match.object, 'requestId', 1);
      });
    });

    it('should only pass on known properties to rpc.send', () => {
      const validPorperties = ['method', 'handle', 'params', 'delta', 'cont', 'id', 'jsonrpc', 'return_empty'];
      function isValid(data) {
        return Object.keys(data).every(key => validPorperties.indexOf(key) !== -1);
      }

      const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
      createSession(false, rpc);

      sandbox.stub(session, 'intercept').returns(Promise.resolve({}));
      const send = sinon.spy(rpc, 'send');

      session.send({ method: 'a', handle: 1, params: [], delta: true, xyz: 'xyz' });
      expect(send).to.have.been.calledWithExactly({ method: 'a', handle: 1, params: [], delta: true });
      expect(send).to.have.been.calledWithExactly(sinon.match(isValid));
    });
  });

  it('should listen to notification and message', () => {
    const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
    const rpcSpy = sinon.spy(rpc, 'on');
    createSession(false, rpc);
    expect(rpcSpy).to.have.been.calledWith('notification', sinon.match.func);
    expect(rpcSpy).to.have.been.calledWith('message', sinon.match.func);
  });

  it('should emit notification:method from rpc', () => {
    const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
    createSession(false, rpc);
    const spy = sinon.spy(session, 'emit');
    rpc.emit('notification', { method: 'FooBar', params: { prop: 'bar' } });
    expect(spy).to.have.been.calledWith('notification:FooBar', { prop: 'bar' });
  });

  it('should emit notifications:* from rpc', () => {
    const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
    createSession(false, rpc);
    const spy = sinon.spy(session, 'emit');
    rpc.emit('notification', { method: 'Foo', params: { prop: 'foo' } });
    rpc.emit('notification', { method: 'FooBar', params: { prop: 'bar' } });
    expect(spy.firstCall).to.have.been.calledWithExactly('notification:*', 'Foo', { prop: 'foo' });
    expect(spy.thirdCall).to.have.been.calledWithExactly('notification:*', 'FooBar', { prop: 'bar' });
  });

  it('should process message from rpc', () => {
    const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
    createSession(false, rpc);
    session.removeAllListeners();

    const emit = sinon.spy(session, 'emit');
    rpc.emit('message', { change: [1, 2, 3] });
    expect(emit.calledThrice).to.equal(true);
    expect(emit).to.have.been.calledWith('handle-changed');

    emit.reset();
    rpc.emit('message', { close: [8, 11] });
    expect(emit.calledTwice).to.equal(true);
    expect(emit).to.have.been.calledWith('handle-closed');
  });

  it('should emit socket error', () => {
    const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
    createSession(false, rpc);
    const emit = sinon.spy(session, 'emit');
    rpc.emit('socket-error', 'fubar');
    expect(emit).to.have.been.calledWith('socket-error', 'fubar');
  });

  it('should emit changed on handle changed', () => {
    const api = {
      emit: sinon.spy(),
    };
    session.apis.add(10, api);
    session.emit('handle-changed', 10);
    expect(api.emit).to.have.been.calledWith('changed');
  });

  it("should not emit changed on handle changed if there isn't an api", () => {
    const api = {
      emit: sinon.spy(),
    };
    session.emit('handle-changed', 10);
    expect(api.emit.callCount).to.equal(0);
  });

  it('should emit closed on handle closed', () => {
    const api = {
      emit: sinon.spy(),
      removeAllListeners: () => {},
    };
    session.apis.add(10, api);
    session.emit('handle-closed', 10);
    expect(api.emit).to.have.been.calledWith('closed');
  });

  it('should remove api on handle closed', () => {
    const api = {
      emit: sinon.spy(),
      removeAllListeners: () => {},
    };
    const remove = sinon.spy(session.apis, 'remove');
    session.apis.add(10, api);
    session.emit('handle-closed', 10);
    expect(remove).to.have.been.calledWith(10);
  });

  it('should not try to remove unexisting api on handle closed', () => {
    const remove = sinon.spy(session.apis, 'remove');
    session.emit('handle-closed', 10);
    expect(remove.callCount).to.equal(0);
  });

  it('should emit closed on close', () => {
    const api2 = {
      emit: sinon.spy(),
      removeAllListeners: () => {},
    };
    session.apis.add(20, api2);
    session.emit('closed');
    expect(api2.emit).to.have.been.calledWith('closed');
    expect(session.apis.getAll().length).to.be.equal(0);
  });

  it('should close', () => {
    const rpc = new RPCMock(Promise, 'http://localhost:4848', url => new SocketMock(url));
    createSession(false, rpc);
    session.connect();
    const close = sinon.spy(rpc, 'close');
    const closePromise = session.close();
    expect(closePromise).to.be.an.instanceOf(Promise);
    expect(close.calledOnce).to.equal(true);
  });

  describe('getObjectApi', () => {
    it('should get an existing api', () => {
      const typeDef = {
        Foo: { In: [], Out: [] },
      };
      session.apis.add(-1, typeDef);
      const api = session.getObjectApi({ handle: -1, id: 'id_1234', type: 'Foo', customType: 'Bar', delta: false });
      expect(api).to.equal(typeDef);
    });

    it('should create and return an api', () => {
      session.getObjectApi({ handle: -1, id: 'id_1234', type: 'Foo', customType: 'Bar' });
      expect(definition.generate).to.be.calledWith('Foo');
      expect(definition.create).to.be.calledWith(session, -1, 'id_1234', true, 'Bar');
    });
  });

  describe('getPatchee', () => {
    it('should get an existing patchee', () => {
      const patchee = {};
      session.apis.add(-1, {});
      session.apis.addPatchee(-1, 'Foo', patchee);
      expect(session.getPatchee(-1, [], 'Foo')).to.equal(patchee);
      expect(session.getPatchee(-1, [], 'Foo')).to.equal(patchee);
    });

    it('should apply and return a patchee', () => {
      const JSONPatch = sinon.stub(JSONPatchMock, 'apply');
      session.apis.add(-1, {});
      session.apis.addPatchee(-1, 'Foo', {});
      session.getPatchee(-1, [{ op: 'add', path: '/', value: {} }], 'Foo');
      expect(JSONPatch).to.have.been.calledWith({}, [{ op: 'add', path: '/', value: {} }]);
      JSONPatch.reset();
      session.apis.addPatchee(-1, 'Bar', []);
      session.getPatchee(-1, [{ op: 'add', path: '/', value: [] }], 'Bar');
      expect(JSONPatch).to.have.been.calledWith([], [{ op: 'add', path: '/', value: [] }]);

      // primitive
      JSONPatch.reset();
      session.apis.addPatchee(-1, 'Baz', 'my folder');
      session.getPatchee(-1, [{ op: 'add', path: '/', value: ['my documents'] }], 'Baz');
      expect(JSONPatch.callCount).to.equal(0);
    });

    describe('primitive patch', () => {
      let value;

      beforeEach(() => {
        session.apis.add(-1, {});
      });

      describe('add', () => {
        const op = 'add';

        it('should return a string', () => {
          value = session.getPatchee(-1, [{ op, path: '/', value: 'A string' }], 'Foo');
          expect(value).to.equal('A string');
        });

        it('should return a boolean', () => {
          value = session.getPatchee(-1, [{ op, path: '/', value: true }], 'Foo');
          expect(value).to.equal(true);
        });

        it('should return a number', () => {
          value = session.getPatchee(-1, [{ op, path: '/', value: 123 }], 'Foo');
          expect(value).to.equal(123);
        });
      });

      describe('replace', () => {
        const op = 'replace';

        it('should return a string', () => {
          value = session.getPatchee(-1, [{ op, path: '/', value: 'A string' }], 'Foo');
          expect(value).to.equal('A string');
        });

        it('should return a boolean', () => {
          value = session.getPatchee(-1, [{ op, path: '/', value: true }], 'Foo');
          expect(value).to.equal(true);
        });

        it('should return a number', () => {
          value = session.getPatchee(-1, [{ op, path: '/', value: 123 }], 'Foo');
          expect(value).to.equal(123);
        });
      });

      it('should cache primitive patches', () => {
        value = session.getPatchee(-1, [{ op: 'add', path: '/', value: 'A string' }], 'Foo');
        expect(value).to.equal('A string');
        expect(session.getPatchee(-1, [], 'Foo')).to.equal(value);
      });

      it('should not throw if primitive patch already exists', () => {
        session.getPatchee(-1, [{ op: 'add', path: '/', value: 'A string' }], 'Foo');
        expect(session.getPatchee(-1, [{ op: 'replace', path: '/', value: 'Bar' }], 'Foo')).to.equal('Bar');
      });
    });
  });

  describe('intercept', () => {
    it('should call interceptors onFulfilled', () => {
      const interceptors = [{ onFulfilled: sinon.stub().returns({ bar: {} }) }];
      return expect(session.intercept(Promise.resolve({ foo: {} }), interceptors))
        .to.eventually.deep.equal({ bar: {} });
    });

    it('should reject and stop the interceptor chain', () => {
      const spyFulFilled = sinon.spy();
      const interceptors = [{ onFulfilled() { return Promise.reject('foo'); } }, { onFulfilled: spyFulFilled }];
      return expect(session.intercept(Promise.resolve(), interceptors).then(() => {}, (err) => {
        expect(spyFulFilled.callCount).to.equal(0);
        return Promise.reject(err);
      })).to.eventually.be.rejectedWith('foo');
    });

    it('should call interceptors onRejected', () => {
      const onRejected = sinon.stub().returns('foo');
      const interceptors = [{ onFulfilled() { return Promise.reject('foo'); } }, { onFulfilled() {}, onRejected }];
      return expect(session.intercept(Promise.resolve(), interceptors, {})).to.eventually.equal('foo');
    });
  });

  describe('processErrorInterceptor', () => {
    it('should reject and emit if the response contains an error', () => {
      const emit = sandbox.stub(session, 'emit');
      return session.processErrorInterceptor({}, { error: 'FUBAR' }).then(null, (err) => {
        expect(emit).to.have.been.calledWithExactly('qix-error', 'FUBAR');
        expect(err).to.equal('FUBAR');
      });
    });

    it('should not reject if the response does not contain any error', () => {
      const response = {};
      expect(session.processErrorInterceptor({}, response)).to.equal(response);
    });
  });

  describe('processDeltaInterceptor', () => {
    let response = { result: { foo: {} } };

    it('should call getPatchee', () => {
      response = { result: { qReturn: [{ foo: {} }] }, delta: true };
      const stub = sinon.stub(session, 'getPatchee').returns(response.result.qReturn);
      session.processDeltaInterceptor({ handle: 1, method: 'Foo', outKey: -1 }, response);
      expect(stub).to.have.been.calledWith(1, response.result.qReturn, 'Foo-qReturn');
    });

    it('should reject when response is not an array of patches', () => {
      response = { result: { qReturn: { foo: {} } }, delta: true };
      return expect(session.processDeltaInterceptor({ handle: 1, method: 'Foo', outKey: -1 }, response)).to.eventually.be.rejectedWith('Unexpected rpc response, expected array of patches');
    });

    it('should return response if delta is falsy', () => {
      response = { result: { qReturn: [{ foo: {} }] }, delta: false };
      expect(session.processDeltaInterceptor({ handle: 1, method: 'Foo', outKey: -1 }, response)).to.equal(response);
    });
  });

  describe('processResultInterceptor', () => {
    const response = { result: { foo: {} } };

    it('should return result', () => {
      expect(session.processResultInterceptor({ outKey: -1 }, response))
        .to.be.equal(response.result);
    });
  });

  describe('processOutInterceptor', () => {
    it('should return result with out key', () => {
      const result = { foo: { bar: {} } };
      expect(session.processOutInterceptor({ outKey: 'foo' }, result)).to.be.equal(result.foo);
    });

    it('should return result with return key', () => {
      const result = { qReturn: { foo: {} } };
      expect(session.processOutInterceptor({ outKey: -1 }, result)).to.be.equal(result.qReturn);
    });

    it('should return result if neither out key or return key is specified', () => {
      const result = { foo: {} };
      expect(session.processOutInterceptor({ outKey: -1 }, result)).to.be.equal(result);
    });
  });

  describe('processObjectApiInterceptor', () => {
    it('should call getObjectApi', () => {
      const response = { qHandle: 1, qType: 'Foo', qGenericId: 'Baz', qGenericType: 'Bar' };
      const stub = sinon.stub(session, 'getObjectApi');
      session.processObjectApiInterceptor({}, response);
      expect(stub).to.have.been.calledWith({ handle: 1, type: 'Foo', id: 'Baz', customType: 'Bar', delta: true });
    });

    it("should return null if requested object doesn't exist", () => {
      const response = { qHandle: null, qType: null };
      return expect(session.processObjectApiInterceptor({}, response)).to.equal(null);
    });

    it('should return response argument if qHandle/qType are undefined', () => {
      const response = {};
      return expect(session.processObjectApiInterceptor({}, response)).to.equal(response);
    });
  });

  describe('addToPromiseChain', () => {
    it('should add value on promise', () => {
      const promise = Promise.resolve();
      Session.addToPromiseChain(promise, 'foo', 'bar');
      expect(promise.foo).to.equal('bar');
    });

    it('should add value to chained promise', () => {
      const promise = Promise.resolve();
      Session.addToPromiseChain(promise, 'foo', 'bar');
      const p1 = promise.then();
      const p2 = p1.then();
      expect(p1.foo).to.equal('bar');
      expect(p2.foo).to.equal('bar');
    });

    it('should chain as normal', () => {
      const promise = Promise.resolve('baz');
      Session.addToPromiseChain(promise, 'foo', 'bar');
      const p1 = promise.then(s => `${s}1`);
      return expect(p1).to.eventually.equal('baz1');
    });
  });
});
