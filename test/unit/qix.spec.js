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

  describe('getGlobal', () => {
    let cfg;
    let session;
    let stubApi;
    let globalApi;

    beforeEach(() => {
      cfg = {
      };
      stubApi = {};
      session = {
        connect: sinon.stub().returns(Promise.resolve()),
        send: sinon.stub().returns(Promise.resolve()),
        apis: { getObjectApi: sinon.stub().returns(stubApi) },
      };
      sandbox.stub(Qix, 'getSession').returns(session);

      return Qix.getGlobal(session, cfg).then((api) => {
        globalApi = api;
      });
    });

    it('should get global', () => {
      expect(session.apis.getObjectApi).to.have.been.calledWith({ handle: -1, id: 'Global', type: 'Global', customType: 'Global', delta: undefined });
      expect(globalApi).to.deep.equal(stubApi);
    });

    it('should emit close and rethrow on error', () => {
      const s = { connect: sandbox.stub().returns(Promise.reject('Foo')), emit: sandbox.spy() };
      return Qix.getGlobal(s).then(() => {}, () => {
        expect(s.emit).to.have.been.calledWithExactly('closed', 'Foo');
      });
    });
  });

  describe('getSession', () => {
    const rpc = {};

    beforeEach(() => {
      sandbox.stub(Qix, 'buildUrl').returns('url');
      sandbox.stub(Qix, 'createRPC').returns(rpc);
    });
  });

  describe('get', () => {
    let appApi;
    let globalApi;
    let session;

    beforeEach(() => {
      session = {};
      appApi = {};
      globalApi = {
        openDoc: sinon.stub().returns(Promise.resolve(appApi)),
      };
      sandbox.stub(Qix, 'getGlobal').returns(Promise.resolve(globalApi));
    });

    it('should get global', (done) => {
      Qix.get(session, {}).then(({ global: g }) => {
        expect(g).to.equal(globalApi);
        done();
      });
    });

    it('should get global and app', () => {
      Qix.get(session, { appId: 'foo' }).then(({ app, global: g }) => {
        expect(app).to.equals(appApi);
        expect(g).to.equals(globalApi);
      });
    });
  });

  describe('connect', () => {
    let session;
    let result;
    let config;

    beforeEach(() => {
      session = {};
      result = {};
      config = {};
      sandbox.stub(Qix, 'getSession').returns(session);
      sandbox.stub(Qix, 'get').returns(result);
    });

    it('should call getSession with config', () => {
      Qix.connect(config);
      expect(Qix.getSession).to.be.calledWith(config);
    });

    it('should call get with session & config', () => {
      Qix.connect(config);
      expect(Qix.get).to.be.calledWith(session, config);
    });

    it('should keep constructed QixDefinition', () => {
      config.schema = new Schema(Promise, {});
      Qix.connect(config);
      expect(Qix.getSession).to.be.calledWithMatch({ schema: config.schema });
    });

    it('should default JSONPatch', () => {
      Qix.connect(config);
      expect(Qix.getSession).to.be.calledWithMatch({ JSONPatch: Patch });
    });

    it('should throw on missing Promise implementation', () => {
      const oldPromise = global.Promise;
      delete global.Promise;
      expect(Qix.connect.bind(null, config)).to.throw();
      global.Promise = oldPromise;
    });

    it('should use default parameters in browser env', () => {
      const oldWebSocket = global.WebSocket;
      global.WebSocket = sinon.stub();
      Qix.connect(config);
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
      Qix.connect(config);
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
      Qix.connect(config);
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
      Qix.connect(config);
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
      Qix.connect(config);
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
      Qix.connect(config);
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
