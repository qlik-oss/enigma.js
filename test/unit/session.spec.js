import Promise from 'bluebird';
import Session from '../../src/session';
import SuspendResume from '../../src/suspend-resume';
import RPCMock from '../mocks/rpc-mock';
import SocketMock from '../mocks/socket-mock';

describe('Session', () => {
  let session;
  let sandbox;
  let suspendResume;
  const apis = {};
  const intercept = { execute: () => Promise.resolve() };
  const createSession = (throwError, rpc, listeners) => {
    const defaultRpc = new RPCMock({
      Promise,
      url: 'http://localhost:4848',
      createSocket: url => new SocketMock(url, throwError),
    });
    suspendResume = new SuspendResume({ Promise, rpc: rpc || defaultRpc, apis });
    session = new Session({
      Promise,
      eventListeners: listeners,
      apis,
      suspendResume,
      intercept,
      rpc: rpc || defaultRpc,
    });
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

    const changeSpy = sinon.spy();
    session.on('handle-changed', changeSpy);

    rpc.emit('message', { change: [1, 2, 3] });
    expect(changeSpy.calledThrice).to.equal(true);

    const closeSpy = sinon.spy();
    session.on('handle-closed', closeSpy);

    rpc.emit('message', { close: [1, 2, 3] });
    expect(closeSpy.calledThrice).to.equal(true);
  });

  it('should emit socket error', () => {
    const rpc = new RPCMock(Promise, SocketMock, 'http://localhost:4848', {});
    createSession(false, rpc);
    const emit = sinon.spy(session, 'emit');
    rpc.emit('socket-error', 'fubar');
    expect(emit).to.have.been.calledWith('socket-error', 'fubar');
  });


  it('should close', () => {
    const rpc = new RPCMock({ Promise, url: 'http://localhost:4848', createSocket: url => new SocketMock(url) });
    createSession(false, rpc);
    session.connect();
    const close = sinon.spy(rpc, 'close');
    const closePromise = session.close();
    expect(closePromise).to.be.an.instanceOf(Promise);
    expect(close.calledOnce).to.equal(true);
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

  describe('suspend/resume', () => {
    it('should reject send() calls during suspended state', () => {
      suspendResume.isSuspended = true;
      expect(session.send()).to.eventually.be.rejectedWith('Session suspended');
    });

    it('should not trigger events during suspended state', () => {
      suspendResume.isSuspended = true;
      const spy = sinon.spy();
      session.on('socket-error', spy);
      session.on('suspended', spy);
      session.on('closed', spy);
      session.on('handle-changed', spy);
      session.on('handle-closed', spy);
      session.onError();
      session.onClosed();
      session.onMessage();
      expect(spy.callCount).to.equal(0);
    });

    it('should close socket and emit suspended', () => {
      const spy = sinon.spy();
      const stub = sinon.stub(session.rpc, 'close').returns(Promise.resolve());
      suspendResume.suspended = () => Promise.resolve();
      session.on('suspended', spy);
      return session.suspend().then(() => {
        expect(stub.calledOnce).to.equal(true);
        expect(spy.calledOnce).to.equal(true);
      });
    });

    it('should open socket and emit resumed', () => {
      const spy = sinon.spy();
      suspendResume.isSuspended = true;
      suspendResume.resume = () => Promise.resolve();
      session.on('resumed', spy);
      return session.resume().then(() => {
        expect(spy.calledOnce).to.equal(true);
      });
    });
  });
});
