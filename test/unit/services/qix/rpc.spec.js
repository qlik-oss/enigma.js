import Promise from 'bluebird';
import RPC from '../../../../src/services/qix/rpc';
import SocketMock from '../../../mocks/socket-mock';

describe('RPC', () => {
  let rpc;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    rpc = new RPC(Promise, 'http://localhost:4848', url => new SocketMock(url), true);
  });

  afterEach(() => {
    SocketMock.removeAllListeners();
    sandbox.restore();
  });

  it('should be a function', () => {
    expect(RPC).to.be.a('function');
    expect(RPC).to.throw();
  });

  it('should set instance variables', () => {
    expect(rpc.resolvers).to.be.an('object');
    expect(rpc.requestId).to.equal(0);
  });

  it('should return a promise when open is called', () => {
    const open = rpc.open();
    expect(open).to.be.an.instanceOf(Promise);
  });

  it('should return the same promise when open is called twice without force', () => {
    const open = rpc.open();
    const openAgain = rpc.open();
    expect(open).to.equal(openAgain);
  });

  it('should return different promises when open is called twice with force', () => {
    const open = rpc.open();
    const openAgain = rpc.open(true);
    expect(open).to.not.equal(openAgain);
  });

  it('should call createSocket when open is called', () => {
    const createSocket = sandbox.spy(rpc, 'createSocket');
    rpc.url = 'foo';
    rpc.sessionConfig = { bar: 'baz' };
    rpc.open();
    expect(createSocket).to.have.been.calledWithExactly(rpc.url, rpc.sessionConfig);
  });

  it('should return SESSION_CREATED when reopen hits the timeout', () => {
    SocketMock.on('created', socket => socket.open());
    const reopen = rpc.reopen(25);
    return reopen.then(state => expect(state).to.equal('SESSION_CREATED'));
  });

  it('should return SESSION_ATTACHED when it receives the session attached notification', () => {
    SocketMock.on('created', socket => socket.open());
    const reopen = rpc.reopen(1000000);
    setTimeout(() => rpc.emit('notification',
      { method: 'OnConnected', params: { qSessionState: 'SESSION_ATTACHED' } }), 25);

    return reopen.then(state => expect(state).to.equal('SESSION_ATTACHED'));
  });

  it("should reject when trying to send a message if the socket isn't open", (done) => {
    rpc.send().then(() => {}, () => {
      done();
    });
  });

  it('should resolve the open promise when connection is established', (done) => {
    rpc.open().then(() => { done(); });
    rpc.socket.open();
  });

  it('should reject open promise if no connection is established', (done) => {
    rpc.open().catch(() => { done(); });
    rpc.socket.error({ message: 'error' });
  });

  it('should emit error', (done) => {
    rpc.once('socket-error', (error) => {
      expect(error).to.equal('error');
      done();
    });
    rpc.open().then(() => {
      rpc.socket.error('error');
    });
    rpc.socket.open();
  });

  it('should resolve the close promise when connection is lost', (done) => {
    const spy = sinon.spy(rpc, 'onClose');

    const closed = () => {
      expect(spy.calledOnce).to.equal(true);
      done();
    };

    const opened = (getClosePromise) => {
      getClosePromise().then(closed);
      rpc.close();
    };

    rpc.open().then(opened);
    rpc.socket.open();
  });

  it('should resolve the close promise when connection is lost with specified code and reason', (done) => {
    const closed = (result) => {
      expect(result.code).to.equal(1000);
      expect(result.reason).to.equal('SHUTDOWN');
      done();
    };

    rpc.open().then(() => {
      rpc.close(1000, 'SHUTDOWN').then(closed);
    });

    rpc.socket.open();
  });

  it('should resolve send promise when message arrives', (done) => {
    const request = { msg: 'hej' };
    const opened = () => {
      rpc.send(request).then((response) => {
        expect(response.msg).to.equal(request.msg);
        done();
      });
      rpc.socket.message({ data: JSON.stringify(request) });
    };

    rpc.open().then(opened);
    rpc.socket.open();
  });

  it('should emit listeners', (done) => {
    const emit = sinon.spy(rpc, 'emit');

    const opened = () => {
      rpc.socket.message({ data: JSON.stringify({
        params: {
          user: 'cam',
        },
      }) });
      expect(emit).to.have.been.calledWith('notification', { params: { user: 'cam' } });
      done();
    };
    rpc.open().then(opened);
    rpc.socket.open();
  });

  it('should emit message', (done) => {
    const emit = sinon.spy(rpc, 'emit');

    const opened = () => {
      rpc.socket.message({ data: JSON.stringify({
        foo: 'bar',
      }) });
      rpc.socket.close();
      expect(emit).to.have.been.calledWith('message', { foo: 'bar' });
      expect(emit).to.have.been.calledWith('closed');
      done();
    };
    rpc.open().then(opened);
    rpc.socket.open();
  });

  it('should register request and unregister when message arrives', (done) => {
    const request = { msg: 'hej' };
    const opened = () => {
      rpc.send(request).then(() => {
        expect(rpc.resolvers['1']).to.be.an('undefined');
        done();
      });
      expect(rpc.resolvers['1']).to.be.an('object');
      rpc.socket.message({ data: JSON.stringify(request) });
    };

    rpc.open().then(opened);
    rpc.socket.open();
  });

  it('should reject all outstanding resolvers on error', () => {
    const rejectWith = sandbox.spy();
    const reason = { reason: 'Socket error' };
    rpc.resolvers = {
      1: {
        rejectWith,
      },
      2: {
        rejectWith,
      },
    };
    rpc.onError(reason);

    expect(rejectWith.callCount).to.equal(2);
    expect(rejectWith).to.be.calledWith(reason);
  });
});
