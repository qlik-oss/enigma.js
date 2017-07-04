import Promise from 'bluebird';
import Patch from '../../src/json-patch';
import Qix from '../../src/qix';
import Schema from '../../src/schema';

describe('Qix', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should be a constructor', () => {
    expect(Qix).to.be.a('function');
    expect(Qix).to.throw();
  });

  describe('create', () => {
    let session;
    let config;

    beforeEach(() => {
      session = {};
      config = {};
      sandbox.stub(Qix, 'getSession').returns(session);
    });

    it('should call getSession with config', () => {
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWith(config);
    });

    it('should keep constructed QixDefinition', () => {
      config.definition = new Schema(Promise, {});
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({ schema: config.schema });
    });

    it('should default JSONPatch', () => {
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({ JSONPatch: Patch });
    });

    it('should throw on missing Promise implementation', () => {
      const oldPromise = global.Promise;
      delete global.Promise;
      expect(Qix.create.bind(null, config)).to.throw();
      global.Promise = oldPromise;
    });

    it('should use default parameters in browser env', () => {
      const oldWebSocket = global.WebSocket;
      global.WebSocket = sinon.stub();
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise: global.Promise,
        createSocket: sinon.match.func,
        mixins: [],
      });
      Qix.getSession.getCall(0).args[0].createSocket('xyz');
      expect(global.WebSocket).to.be.calledWith('xyz');
      global.WebSocket = oldWebSocket;
    });

    it('should use default parameters in NodeJS env', () => {
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise: global.Promise,
        mixins: [],
      });
    });

    it('should accept a reloadUri parameter', () => {
      const createSocket = sinon.stub();
      config.createSocket = createSocket;
      config.Promise = Promise;
      config.appId = 'MyApp';
      config.session = {
        host: 'xyz.com',
        port: 5959,
        reloadURI: 'xyz',
      };
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise,
        createSocket,
        appId: 'MyApp',
        session: {
          host: 'xyz.com',
          port: 5959,
          reloadURI: 'xyz',
          route: undefined,
        },
      });
    });

    it('should use custom url parameters (reloadUri)', () => {
      const createSocket = sinon.stub();
      config.createSocket = createSocket;
      config.Promise = Promise;
      config.appId = 'MyApp';
      config.session = {
        host: 'xyz.com',
        port: 5959,
        urlParams: {
          reloadUri: 'xyz',
        },
      };
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise,
        createSocket,
        appId: 'MyApp',
        session: {
          host: 'xyz.com',
          port: 5959,
          urlParams: {
            reloadUri: 'xyz',
          },
          route: undefined,
        },
      });
    });

    it('should use custom url parameters (qlikTicket)', () => {
      const createSocket = sinon.stub();
      config.createSocket = createSocket;
      config.Promise = Promise;
      config.appId = 'MyApp';
      config.session = {
        host: 'xyz.com',
        port: 5959,
        urlParams: {
          qlikTicket: 'xyzabc123789',
        },
      };
      Qix.create(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise,
        createSocket,
        appId: 'MyApp',
        session: {
          host: 'xyz.com',
          port: 5959,
          urlParams: {
            qlikTicket: 'xyzabc123789',
          },
          route: undefined,
        },
      });
    });

    it('should register mixins', () => {
      const foo = { type: 'Foo', extend: { foo() {} } };
      const bar = { type: 'Bar', extend: { bar() {} } };
      const mixins = [
        foo,
        bar,
      ];
      const registerMixin = sandbox.stub(Schema.prototype, 'registerMixin');
      config.mixins = mixins;
      Qix.create(config);
      expect(registerMixin).to.have.been.calledWith(foo);
      expect(registerMixin).to.have.been.calledWith(bar);
    });
  });

  describe('configureDefaults', () => {
    let config;

    beforeEach(() => {
      config = {};
    });

    it('should set suspendOnClose to false by default', () => {
      Qix.configureDefaults(config);
      expect(config.suspendOnClose).to.equal(false);
    });
  });
});
