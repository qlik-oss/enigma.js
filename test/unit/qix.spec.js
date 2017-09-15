import Promise from 'bluebird';
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

    it('should set protocol.delta to true by default', () => {
      Qix.configureDefaults(config);
      expect(config.protocol.delta).to.equal(true);
    });

    it('should set suspendOnClose to false by default', () => {
      Qix.configureDefaults(config);
      expect(config.suspendOnClose).to.equal(false);
    });
  });
});
