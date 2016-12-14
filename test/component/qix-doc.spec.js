import Promise from 'bluebird';
import Schema from '../../schemas/qix/3.1/schema.json';
import Qix from '../../src/services/qix/index';
import SocketMock from '../mocks/socket-mock';

describe('QIX Doc', () => {
  let sandbox;
  let qix;
  let qixDoc;
  let config;
  let socket;

  beforeEach(() => {
    SocketMock.on('created', (s) => {
      socket = s;
      socket.intercept('OpenDoc').return({ result: { qReturn: { qType: 'Doc', qHandle: 1 } } });
      socket.open();
    });
    qix = new Qix();
    config = {};
    sandbox = sinon.sandbox.create();

    config.Promise = Promise;
    config.schema = Schema;
    config.session = {
      route: 'app/engineData',
      host: 'mocked',
      port: 1337,
    };
    config.createSocket = url =>
    new SocketMock(url)
    ;

    config.mixins = [{
      type: 'Global',
      mixin() {
        return {
          tweet() {
            return Promise.resolve('Mr tweeter!');
          },
        };
      },
      config: {},
    }];
    config.appId = 'my-app';

    return qix.connect(config).then((o) => {
      qixDoc = o.app;
    });
  });

  afterEach(() => {
    SocketMock.removeAllListeners();
    qixDoc.session.on('error', () => {}); // Swallow the error
    return qixDoc.session.close().then(() => {
      sandbox.restore();
    });
  });

  it('should GetObject', () => {
    socket.intercept('GetObject').return({ result: { qReturn: { qType: 'GenericObject', qHandle: 6, qGenericType: 'barchart', qGenericId: 'RPKdHg' } } });
    return qixDoc.getObject({ qId: 'RPKdHg' }).then((o) => {
      const keys = Object.keys(Schema.structs.GenericObject).map(key =>
        key.substring(0, 1).toLowerCase() + key.substring(1)
      );
      expect(Object.keys(Object.getPrototypeOf(o))).to.include.members(keys);
    });
  });
});
