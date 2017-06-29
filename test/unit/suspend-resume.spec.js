import Promise from 'bluebird';
import SuspendResume from '../../src/suspend-resume';
import RPC from '../../src/rpc';
import SocketMock from '../mocks/socket-mock';
import ApiCache from '../../src/api-cache';

describe('Suspend/Resume', () => {
  let suspendResume;
  let rpc;
  let apis;

  beforeEach(() => {
    SocketMock.on('created', socket => socket.open());
    class Dummy extends RPC { reopen() { return super.reopen(5); } }
    rpc = new Dummy({ Promise, url: 'http://localhost:4848', createSocket: url => new SocketMock(url, false) });
    apis = new ApiCache({ Promise, schema: {} });
    suspendResume = new SuspendResume({ Promise, rpc, apis });
  });

  afterEach(() => {
    SocketMock.removeAllListeners('created');
  });

  describe('Suspend', () => {
    it('should set state when suspended', () => {
      suspendResume.suspend();
      expect(suspendResume.isSuspended).to.equal(true);
    });
  });

  describe('Resume', () => {
    it('should reject created sessions when onlyIfAttached is true', () => {
      suspendResume.suspend();
      const p = rpc.open().then(() => suspendResume.resume(true));
      expect(p).to.eventually.be.rejectedWith('Not attached');
    });

    it('should restore global', () => {
      apis.add(-1, { emit: sinon.stub(), handle: -1, type: 'Global' });
      return rpc.open()
        .then(() => suspendResume.resume())
        .then(() => expect(apis.getApi(-1).emit.notCalled).to.equal(true));
    });

    it('should close doc', () => {
      const apisToClose = [
        { emit: sinon.stub(), handle: 1, type: 'Doc', id: 1 },
        { emit: sinon.stub(), handle: 2, type: 'GenericObject', id: 2 },
      ];

      apisToClose.concat([{ emit: sinon.stub(), handle: -1, type: 'Global' }]).forEach(api => apis.add(api.handle, api));

      SocketMock.on('created', (socket) => {
        socket.intercept('GetActiveDoc').return({ error: { message: 'Oh, no!' } });
        socket.intercept('OpenDoc').return({ error: { message: 'Oh, no!' } });
      });

      suspendResume.suspend();

      return rpc.open()
        .then(() => suspendResume.resume(false))
        .then(() => {
          expect(apis.getApis().length).to.equal(1);
          apisToClose.forEach(api => expect(api.emit).to.have.been.calledWith('closed'));
        });
    });

    it('should restore doc and objects', () => {
      const apisToChange = [
        { emit: sinon.stub(), handle: 1, type: 'Doc', id: 1 },
        { emit: sinon.stub(), handle: 2, type: 'GenericObject', id: 2 },
        { emit: sinon.stub(), handle: 3, type: 'GenericVariable', id: 3 },
      ];
      const apisToClose = [
        { emit: sinon.stub(), handle: 4, type: 'Field', id: 4 },
        { emit: sinon.stub(), handle: 5, type: 'GenericDummy', id: 5 },
        { emit: sinon.stub(), handle: 6, type: 'GenericBookmark', id: 6 },
      ];

      apisToChange.concat(apisToClose).concat([{ emit: sinon.stub(), handle: -1, type: 'Global' }])
        .forEach(api => apis.add(api.handle, api));

      SocketMock.on('created', (socket) => {
        socket.intercept('GetActiveDoc').return({ result: { qReturn: { qHandle: 101 } } });
        socket.intercept('GetObject').return({ result: { qReturn: { qHandle: 102 } } });
        socket.intercept('GetVariableById').return({ result: { qReturn: { qHandle: 103 } } });
        socket.intercept('GetDummy').return({ error: {} });
        socket.intercept('GetBookmark').return({ result: { qReturn: { qHandle: null } } });
      });

      suspendResume.suspend();

      return rpc.open()
        .then(() => suspendResume.resume(true))
        .catch(() => {
          apisToChange.forEach(api => expect(api.emit.notCalled).to.equal(true));
          apisToClose.forEach(api => expect(api.emit.notCalled).to.equal(true));
        })
        .then(() => suspendResume.resume(false))
        .then(() => {
          expect(apis.getApis().length).to.equal(4);
          apisToChange.forEach(api => expect(api.emit).to.have.been.calledWith('changed'));
          apisToClose.forEach(api => expect(api.emit).to.have.been.calledWith('closed'));
        });
    });
  });
});
