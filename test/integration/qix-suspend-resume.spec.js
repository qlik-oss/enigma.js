import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/services/qix/index';
import Schema from '../../schemas/qix/3.2/schema.json';

// N.B. This test will only pass when run towards an enginge supporting the session TTL feature.
describe('QIX Suspend/Resume', () => {
  const qix = new Qix();
  let config;

  before(() => {
    config = {
      Promise,
      schema: Schema,
      session: {
        host: 'localhost',
        port: 4848,
        secure: false,
        ttl: 3600,
        identity: Math.floor(Math.random() * 10000).toString(), // Poor man's GUID :)
      },
      createSocket: url => new WebSocket(url),
    };
  });

  it('should suspend and resume', () => {
    let handleBeforeResume;
    let propertiesBeforeResume;

    return qix.connect(config).then((qixService) => {
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
});
