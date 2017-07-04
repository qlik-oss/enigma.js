import Promise from 'bluebird';
import schema from '../../schemas/qix/3.2/schema.json';
import Qix from '../../src/qix';
import SocketMock from '../mocks/socket-mock';

describe('QIX Doc', () => {
  let sandbox;
  let qixDoc;
  let config;
  let socket;

  beforeEach(() => {
    SocketMock.on('created', (s) => {
      socket = s;
      socket.intercept('OpenDoc').return({ result: { qReturn: { qType: 'Doc', qHandle: 1 } } });
      socket.open();
    });
    config = {};
    sandbox = sinon.sandbox.create();

    config.Promise = Promise;
    config.schema = schema;
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

    return Qix.connect(config).then((o) => {
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

  it('should have the right type', () => {
    expect(qixDoc.type).to.equal('Doc');
    expect(qixDoc.genericType).to.equal(undefined);
  });

  describe('Calling GetObject', () => {
    let barchartObject;
    beforeEach(() => {
      socket.intercept('GetObject').return({ result: { qReturn: { qType: 'GenericObject', qHandle: 6, qGenericType: 'barchart', qGenericId: 'RPKdHg' } } });
      return qixDoc.getObject({ qId: 'RPKdHg' }).then((object) => {
        barchartObject = object;
      });
    });
    it('should return a barchart GenericObject with the expected members', () => {
      const keys = Object.keys(schema.structs.GenericObject).map(key =>
        key.substring(0, 1).toLowerCase() + key.substring(1),
      );
      expect(Object.keys(Object.getPrototypeOf(barchartObject))).to.include.members(keys);
      expect(barchartObject.type).to.equal('GenericObject');
      expect(barchartObject.genericType).to.equal('barchart');
    });
  });
});
