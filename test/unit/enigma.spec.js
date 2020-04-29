import enigma from '../../src/enigma';
import Schema from '../../src/schema';

describe('enigma', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('create', () => {
    let session;
    let config;

    beforeEach(() => {
      session = {};
      config = {};
      sandbox.stub(enigma, 'getSession').returns(session);
    });

    it('should call getSession with config', () => {
      enigma.create(config);
      expect(enigma.getSession).to.be.calledWith(config);
    });

    it('should keep constructed QixDefinition', () => {
      config.definition = new Schema(Promise, {});
      enigma.create(config);
      expect(enigma.getSession).to.be.calledWithMatch({ schema: config.schema });
    });

    it('should throw on missing Promise implementation', () => {
      const oldPromise = global.Promise;
      delete global.Promise;
      expect(enigma.create.bind(null, config)).to.throw();
      global.Promise = oldPromise;
    });

    it('should use default parameters in browser env', () => {
      const oldWebSocket = global.WebSocket;
      global.WebSocket = sinon.stub();
      enigma.create(config);
      expect(enigma.getSession).to.be.calledWithMatch({
        Promise: global.Promise,
        createSocket: sinon.match.func,
        mixins: [],
      });
      enigma.getSession.getCall(0).args[0].createSocket('xyz');
      expect(global.WebSocket).to.be.calledWith('xyz');
      global.WebSocket = oldWebSocket;
    });

    it('should use default parameters in NodeJS env', () => {
      enigma.create(config);
      expect(enigma.getSession).to.be.calledWithMatch({
        Promise: global.Promise,
        mixins: [],
      });
    });

    it('should register mixins', () => {
      const foo = { type: 'Foo', extend: { foo() { } } };
      const bar = { type: 'Bar', extend: { bar() { } } };
      const mixins = [
        foo,
        bar,
      ];
      const registerMixin = sandbox.stub(Schema.prototype, 'registerMixin');
      config.mixins = mixins;
      enigma.create(config);
      expect(registerMixin).to.have.been.calledWith(foo);
      expect(registerMixin).to.have.been.calledWith(bar);
    });
  });

  describe('configureDefaults', () => {
    let config;

    beforeEach(() => {
      config = {};
    });

    it('should throw if no object reference is passed in', () => {
      expect(() => enigma.configureDefaults(null)).to.throw();
    });

    it('should set protocol.delta to true by default', () => {
      enigma.configureDefaults(config);
      expect(config.protocol.delta).to.equal(true);
    });

    it('should set suspendOnClose to false by default', () => {
      enigma.configureDefaults(config);
      expect(config.suspendOnClose).to.equal(false);
    });
  });
});
