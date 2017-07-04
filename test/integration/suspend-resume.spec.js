import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/qix';
import Schema from '../../schemas/qix/3.2/schema.json';

function generateId() {
  return Math.floor(Math.random() * 10000).toString();
}

function buildUrl(ttl) {
  ttl = typeof ttl !== 'undefined' ? ttl : 3600;
  return `ws://localhost:4848/app/engineData/ttl/${ttl}/identity/${generateId()}`;
}

// N.B. This test will only pass when run towards an engine supporting the session TTL feature.
describe('QIX Suspend/Resume', () => {
  let config;

  beforeEach(() => {
    config = {
      Promise,
      schema: Schema,
      url: buildUrl(),
      createSocket: url => new WebSocket(url),
      listeners: {},
    };
  });

  it('should suspend and resume by reattaching', () => {
    let handleBeforeResume;
    let propertiesBeforeResume;

    return Qix.connect(config).then((qixService) => {
      const global = qixService.global;
      return global.createSessionApp().then(app =>
        app.createObject({ qInfo: { qId: 'OBJ01', qType: 'abc' } })
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
              .then(props => expect(propertiesBeforeResume).to.deep.equal(props))
              .then(() => global.session.close());
          })
      );
    });
  });

  it('should suspend and resume by reopening the previous document', () => {
    config.url = buildUrl(0);
    config.listeners.suspended = sinon.spy();
    config.listeners.closed = sinon.spy();
    const id = generateId();
    let global;
    let app;

    return Qix.connect(config)
      // save ref to global API:
      .then(qixService => (global = qixService.global))
      // create our test app:
      .then(() => global.createApp(id))
      // open our test app:
      .then(() => global.openDoc(id))
      // save ref to app API:
      .then(_app => (app = _app))
      // set a dummy property that we don't save:
      .then(() => app.setAppProperties({ test: true }))
      .then(() => global.session.suspend())
      .then(() => expect(config.listeners.suspended.calledOnce).to.equal(true))
      .then(() => global.session.resume())
      .then(() => app.getAppProperties())
      // verify that we have reconnected to a fresh app, since we never saved
      // this property it shouldn't exist in a new one:
      .then(props => expect(props.test).to.equal(undefined))
      .then(() => global.deleteApp(app.id))
      .then(() => global.session.close())
      .then(() => expect(config.listeners.closed.calledOnce).to.equal(true));
  });
});
