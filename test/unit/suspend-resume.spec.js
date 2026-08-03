import SuspendResume from '../../src/suspend-resume';
import RPC from '../../src/rpc';
import SocketMock from '../mocks/socket-mock';
import ApiCache from '../../src/api-cache';

describe('Suspend/Resume', () => {
  let suspendResume;
  let rpc;
  let apis;

  const createApi = (handle, type, id) => ({
    on: sinon.stub(),
    emit: sinon.stub(),
    removeAllListeners: () => {},
    handle,
    type,
    id,
  });

  beforeEach(async () => {
    SocketMock.on('created', (socket) => socket.open());
    rpc = new RPC({ Promise, url: 'http://localhost:4848', createSocket: (url) => new SocketMock(url, false) });
    apis = new ApiCache({ Promise, schema: {} });
    suspendResume = new SuspendResume({ Promise, rpc, apis });
    const { reopen } = suspendResume;
    suspendResume.reopen = (val, force) => reopen.call(suspendResume, force ? val : 5);
    await rpc.open();
  });

  afterEach(() => {
    SocketMock.removeAllListeners('created');
  });

  describe('Suspend', () => {
    it('should set state when manually suspended', async () => {
      await suspendResume.suspend();
      expect(suspendResume.isSuspended).to.equal(true);
    });
  });

  describe('Resume', () => {
    it('should reject created sessions when onlyIfAttached is true', async () => {
      await suspendResume.suspend();
      await expect(suspendResume.resume(true)).to.be.rejectedWith({ message: 'Not attached' });
    });

    it('should restore global', async () => {
      apis.add(-1, createApi(-1, 'Global'));
      await suspendResume.suspend();
      await suspendResume.resume();
      expect(apis.getApi(-1).emit.notCalled).to.equal(true);
    });

    it('should close doc', async () => {
      const apisToClose = [
        createApi(1, 'Doc', 1),
        createApi(2, 'GenericObject', 2),
      ];

      apisToClose
        .concat([createApi(-1, 'Global')])
        .forEach((api) => apis.add(api.handle, api));

      SocketMock.on('created', (socket) => {
        socket
          .intercept('GetActiveDoc')
          .return({ error: { message: 'Oh, no!' } });
        socket.intercept('OpenDoc').return({ error: { message: 'Oh, no!' } });
      });

      await suspendResume.suspend();
      await suspendResume.resume(false);
      expect(apis.getApis().length).to.equal(1);
      apisToClose.forEach((api) => expect(api.emit).to.have.been.calledWith('closed'));
    });

    it('should restore doc and objects', async () => {
      const apisToChange = [
        createApi(1, 'Doc', 1),
        createApi(2, 'GenericObject', 2),
        createApi(3, 'GenericVariable', 3),
      ];
      const apisToClose = [
        createApi(4, 'Field', 4),
        createApi(5, 'GenericDummy', 5),
        createApi(6, 'GenericBookmark', 6),
      ];

      apisToChange
        .concat(apisToClose)
        .concat([createApi(-1, 'Global')])
        .forEach((api) => apis.add(api.handle, api));

      SocketMock.on('created', (socket) => {
        socket
          .intercept('GetActiveDoc')
          .return({ result: { qReturn: { qHandle: 101 } } });
        socket
          .intercept('GetObject')
          .return({ result: { qReturn: { qHandle: 102 } } });
        socket
          .intercept('GetVariableById')
          .return({ result: { qReturn: { qHandle: 103 } } });
        socket.intercept('GetDummy').return({ error: {} });
        socket
          .intercept('GetBookmark')
          .return({ result: { qReturn: { qHandle: null } } });
      });

      await suspendResume.suspend();
      try {
        await suspendResume.resume(true);
      } catch (err) {
        apisToChange.forEach((api) => expect(api.emit.notCalled).to.equal(true));
        apisToClose.forEach((api) => expect(api.emit.notCalled).to.equal(true));
      }
      await suspendResume.resume(false);
      expect(apis.getApis().length).to.equal(4);
      apisToChange.forEach((api) => expect(api.emit).to.have.been.calledWith('changed'));
      apisToClose.forEach((api) => expect(api.emit).to.have.been.calledWith('closed'));
    });

    it('should return SESSION_CREATED when reopen hits the timeout', async () => {
      const reopenPromise = suspendResume.reopen(25, true);
      await expect(reopenPromise).to.become('SESSION_CREATED');
    });

    it('should return SESSION_ATTACHED when it receives the session attached notification', async () => {
      const reopenPromise = suspendResume.reopen(1000000, true);
      setTimeout(
        () => rpc.emit('notification', {
          method: 'OnConnected',
          params: { qSessionState: 'SESSION_ATTACHED' },
        }),
        25,
      );

      await expect(reopenPromise).to.become('SESSION_ATTACHED');
    });
  });
});
