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

  it('should build an url depending on config', () => {
    expect(Qix.buildUrl({ secure: true })).to.equal('wss://localhost');
    expect(Qix.buildUrl({ secure: true }, 'myApp1')).to.equal('wss://localhost/app/myApp1');
    expect(Qix.buildUrl({
      secure: true,
      port: 666,
    }, 'myApp3')).to.equal('wss://localhost:666/app/myApp3');
    expect(Qix.buildUrl({
      secure: true,
      host: 'foo.com',
    }, 'myApp3')).to.equal('wss://foo.com/app/myApp3');
    expect(Qix.buildUrl({
      secure: false,
      host: 'foo.com',
    }, 'myApp3')).to.equal('ws://foo.com/app/myApp3');
    expect(Qix.buildUrl({
      secure: true,
      port: 666,
      route: 'myroute',
    })).to.equal('wss://localhost:666/myroute');
    expect(Qix.buildUrl({
      secure: true,
      port: 666,
      route: '/myroute',
    })).to.equal('wss://localhost:666/myroute');
    expect(Qix.buildUrl({
      secure: true,
      port: 666,
      route: 'myroute/',
    })).to.equal('wss://localhost:666/myroute');
    expect(Qix.buildUrl({
      secure: true,
      port: 666,
      route: '/my/route/',
    })).to.equal('wss://localhost:666/my/route');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
    }, 'myApp4')).to.equal('wss://localhost:4848/myproxy/app/myApp4');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      reloadURI: 'http://qlik.com',
    }, 'myApp5')).to.equal('wss://localhost:4848/myproxy/app/myApp5?reloadUri=http%3A%2F%2Fqlik.com');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      urlParams: {
        reloadUri: 'http://qlik.com',
      },
    }, 'myApp6')).to.equal('wss://localhost:4848/myproxy/app/myApp6?reloadUri=http%3A%2F%2Fqlik.com');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      urlParams: {
        reloadUri: 'http://qlik.com',
      },
      identity: 'migration-service',
    }, 'myApp7')).to.equal('wss://localhost:4848/myproxy/app/myApp7/identity/migration-service?reloadUri=http%3A%2F%2Fqlik.com');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      subpath: 'dataprepservice',
    }, 'myApp8')).to.equal('wss://localhost:4848/myproxy/dataprepservice/app/myApp8');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      urlParams: {
        qlikTicket: 'abcdefg123456',
      },
    }, 'myApp9')).to.equal('wss://localhost:4848/app/myApp9?qlikTicket=abcdefg123456');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      urlParams: {
        reloadUri: 'http://qlik.com',
        qlikTicket: 'abcdefg123456',
      },
    }, 'myApp10')).to.equal('wss://localhost:4848/app/myApp10?reloadUri=http%3A%2F%2Fqlik.com&qlikTicket=abcdefg123456');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      reloadURI: 'http://community.qlik.com',
      urlParams: {
        reloadUri: 'http://qlik.com',
        qlikTicket: 'abcdefg123456',
      },
    }, 'myApp11')).to.equal('wss://localhost:4848/app/myApp11?reloadUri=http%3A%2F%2Fqlik.com&qlikTicket=abcdefg123456');
    expect(Qix.buildUrl({
      secure: true,
      port: 4848,
      reloadURI: 'http://community.qlik.com',
      urlParams: {
        reloadUri: 'http://qlik.com',
        qlikTicket: 'abcdefg123456',
      },
      ttl: 1000,
    }, 'myApp11')).to.equal('wss://localhost:4848/app/myApp11/ttl/1000?reloadUri=http%3A%2F%2Fqlik.com&qlikTicket=abcdefg123456');
  });

  describe('getGlobal', () => {
    let cfg;
    let session;
    let stubApi;
    let globalApi;

    beforeEach(() => {
      cfg = {
        session: {},
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
      const oldLocation = global.location;
      const oldWebSocket = global.WebSocket;
      global.location = {
        hostname: '123.123.123.123',
        href: 'http://123.123.123.123:4848',
      };
      global.WebSocket = sinon.stub();
      Qix.connect(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise: global.Promise,
        session: {
          host: '123.123.123.123',
          route: 'app/engineData',
        },
        createSocket: sinon.match.func,
        mixins: [],
      });
      Qix.getSession.getCall(0).args[0].createSocket('xyz');
      expect(global.WebSocket).to.be.calledWith('xyz');
      global.location = oldLocation;
      global.WebSocket = oldWebSocket;
    });

    it('should use default parameters in NodeJS env', () => {
      Qix.connect(config);
      expect(Qix.getSession).to.be.calledWithMatch({
        Promise: global.Promise,
        session: {
          host: 'localhost',
          route: 'app/engineData',
          urlParams: undefined,
        },
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
      config = {
        session: {},
      };
    });

    it('should set secure by default', () => {
      Qix.configureDefaults(config);
      expect(config.session.secure).to.equal(true);
    });

    it('should convert unsecure parameter to secure if the secure parameter is not set', () => {
      config.session.unsecure = false;
      Qix.configureDefaults(config);
      expect(config.session.secure).to.equal(true);
    });

    it('should give secure precedence', () => {
      config.session.secure = true;
      config.session.unsecure = true;
      Qix.configureDefaults(config);
      expect(config.session.secure).to.equal(true);
    });

    it('should set suspendOnClose to false by default', () => {
      Qix.configureDefaults(config);
      expect(config.session.suspendOnClose).to.equal(false);
    });
  });
});
