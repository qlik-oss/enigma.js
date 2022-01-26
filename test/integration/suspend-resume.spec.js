import enigma from '../../src/enigma';
import utils from './utils';

describe('QIX Suspend/Resume', () => {
  let config;

  beforeEach(() => {
    config = utils.getDefaultConfig(5);
  });

  it('should suspend and resume by reattaching', async () => {
    let handleBeforeResume;
    let propertiesBeforeResume;

    return enigma.create(config).open().then((global) => global.getActiveDoc().then((app) => app.createObject({ qInfo: { qId: 'OBJ01', qType: 'abc' } })
      .then(() => app.destroyObject('OBJ01'))
      .then(() => app.createObject({ qInfo: { qId: 'OBJ02', qType: 'abc' } }))
      .then((obj) => {
        handleBeforeResume = obj.handle;
        return obj.getProperties()
          .then((props) => { propertiesBeforeResume = props; })
          .then(() => global.session.suspend())
          .then(() => global.session.resume(false))
          .then(() => expect(handleBeforeResume).to.not.equal(obj.handle))
          .then(() => obj.getProperties())
          .then((props) => expect(propertiesBeforeResume).to.deep.equal(props))
          .then(() => global.session.close());
      })));
  });

  it('should suspend and resume by reopening the previous document', () => {
    config = utils.getDefaultConfig(0);
    const suspended = sinon.spy();
    const closed = sinon.spy();
    const session = enigma.create(config);
    session.on('suspended', suspended);
    session.on('closed', closed);
    let global;
    let app;

    return session.open()
      // save ref to global API:
      .then((g) => { global = g; })
      // open our test app:
      .then(() => global.getActiveDoc())
      // save ref to app API:
      .then((a) => { app = a; })
      // set a dummy property that we don't save:
      .then(() => app.setAppProperties({ test: true }))
      .then(() => session.suspend())
      .then(() => expect(suspended.calledOnce).to.equal(true))
      .then(() => global.session.resume())
      .then(() => app.getAppProperties())
      .then((props) => expect(props.test).to.equal(true))
      .then(() => session.close())
      .catch((error) => session.close().then(() => Promise.reject(error)))
      .then(() => expect(closed.callCount >= 1).to.equal(true));
  });

  it('should suspend session when socket was disconnected', () => {
    config.suspendOnClose = true;
    const suspended = sinon.spy();
    const closed = sinon.spy();
    const session = enigma.create(config);
    session.on('suspended', suspended);
    session.on('closed', closed);
    return session.open().then(() => session.rpc.close(4029)).then(() => new Promise((resolve) => {
      setTimeout(resolve, 1000);
    }).then(() => {
      expect(suspended.calledOnce).to.equal(true);
      expect(closed.calledOnce).to.equal(false);
    }));
  });

  it('should close session even when status code is unknown', () => {
    config.suspendOnClose = false;
    const suspended = sinon.spy();
    const closed = sinon.spy();
    const session = enigma.create(config);
    session.on('suspended', suspended);
    session.on('closed', closed);
    return session.open().then(() => session.rpc.close(4029)).then(() => new Promise((resolve) => {
      setTimeout(resolve, 1000);
    }).then(() => {
      expect(suspended.callCount).to.equal(0);
      expect(closed.calledOnce).to.equal(true);
    }));
  });
});
