import Promise from 'bluebird';
import Schema from '../../src/schema';
import KeyValueCache from '../../src/cache';

describe('Schema', () => {
  let config;
  let definition;

  beforeEach(() => {
    config = {
      Promise,
      schema: { structs: { Foo: { Bar: { In: [], Out: [] } } } },
      protocol: { delta: true },
    };
    definition = new Schema(config);
  });

  it('should be a constructor', () => {
    expect(Schema).to.be.a('function');
    expect(Schema).to.throw();
  });

  it('should add a definition', () => {
    expect(definition.schema).to.deep.equal(config.schema);
    expect(definition.types).to.be.an.instanceOf(KeyValueCache);
  });

  it('should generate a type', () => {
    const type = definition.generate('Foo');
    expect(type.create).to.be.a('function');
    expect(type.def).to.be.an('object');
  });

  it('should throw if type is not defined', () => {
    expect(definition.generate.bind(definition, 'Foo1')).to.throw();
  });

  it('should return cached type', () => {
    const type = definition.generate('Foo');
    // what kind of test is this??
    expect(definition.generate('Foo')).to.equal(type);
  });

  describe('register mixin', () => {
    let mixin;

    beforeEach(() => {
      mixin = { types: 'Foo', extend: { tweet() { /* dummy */ } } };
    });

    it('should add mixins to cache', () => {
      definition.registerMixin(mixin);
      expect(definition.mixins.get('Foo').length).to.equal(1);
      definition.registerMixin(mixin);
      expect(definition.mixins.get('Foo').length).to.equal(2);
    });

    it('should silently accept a type as string', () => {
      delete mixin.types;
      mixin.type = 'Foo';
      definition.registerMixin(mixin);
      expect(definition.mixins.get('Foo').length).to.equal(1);
    });

    it('should add the same mixin for several types', () => {
      mixin.types = ['Foo', 'Shoe'];
      definition.registerMixin(mixin);
      expect(definition.mixins.get('Foo').length).to.equal(1);
      expect(definition.mixins.get('Shoe').length).to.equal(1);
    });

    it('should not allow extend if method already exists', () => {
      mixin.extend = { bar() {} };
      definition.registerMixin(mixin);
      expect(definition.generate.bind(definition, 'Foo')).to.throw();
    });

    it('should allow overrides if specified', () => {
      let baseArg;
      let fnArgs;
      mixin.override = {
        bar(_bar, args) {
          baseArg = _bar;
          fnArgs = args;
        },
      };
      definition.registerMixin(mixin);
      const type = definition.generate('Foo');
      const api = type.create({}, 0, 'id', 'custom');
      api.bar('xyz');
      expect(baseArg).to.be.a('function');
      expect(fnArgs).to.equal('xyz');
    });

    it('should allow override only if method is defined on base object', () => {
      delete mixin.extend;
      mixin.override = { tweet() {} };
      definition.registerMixin(mixin);
      expect(definition.generate.bind(definition, 'Foo')).to.throw();
    });

    it('should mixin apis', () => {
      definition.registerMixin(mixin);
      const type = definition.generate('Foo');
      const obj = type.create({}, 0, 'id', 'custom');
      expect(obj.tweet).to.be.a('function');
    });

    it('should only mixin once when type and custom type is equals', () => {
      const spy = sinon.spy(definition, 'mixinType');

      definition.registerMixin('Foo', mixin);
      const type = definition.generate('Foo');
      type.create({}, 0, 'id', 'Foo');

      expect(spy.callCount).to.equals(1);
    });

    it('call mixin init function with correct parameters', () => {
      config.customProp = true;
      definition = new Schema(config);
      let mixinArgs = {};
      mixin.types = ['custom'];
      mixin.init = function init(initArgs) {
        mixinArgs = initArgs;
      };
      definition.registerMixin(mixin);
      const type = definition.generate('Foo');
      type.create({}, 0, 'id', 'custom');
      expect(mixinArgs.config.Promise).to.be.equal(Promise);
      expect(mixinArgs.config.customProp).to.be.equal(true);
      expect(mixinArgs.api.bar).to.be.a('function');
      expect(mixinArgs.api.tweet).to.be.a('function');
    });

    it('should mixin multiple apis', () => {
      mixin.types = ['Foo', 'Bar'];
      definition.registerMixin(mixin);
      expect(definition.mixins.get('Foo').length).to.equal(1);
      expect(definition.mixins.get('Bar').length).to.equal(1);
    });
  });
  describe('generateDefaultApi', () => {
    it('should add method', (done) => {
      const target = {};
      const source = { Foo: { In: [], Out: [] } };
      definition.generateDefaultApi(target, source);
      sinon.stub(target, 'foo').callsFake(done);
      target.foo();
    });

    it('should call send with correct parameters', () => {
      const send = sinon.spy();
      const target = {
        handle: 1,
        delta: false,
        session: { send },
      };
      const source = { Foo: { In: [], Out: [] } };
      definition.generateDefaultApi(target, source);
      target.foo('123', {});
      expect(send).to.have.been.calledWith({
        method: 'Foo',
        params: ['123', {}],
        handle: 1,
        delta: false,
        outKey: -1,
      });
    });

    it('should call send with id and correct parameters', () => {
      const send = sinon.spy();
      const target = {
        handle: 1,
        delta: false,
        session: {
          send,
        },
      };
      const source = {
        Foo: { In: [{ Name: 'qId' }], Out: [] },
      };
      definition.generateDefaultApi(target, source);
      target.foo('123', {});
      expect(send).to.have.been.calledWith({
        method: 'Foo',
        params: ['123', {}],
        handle: 1,
        delta: false,
        outKey: -1,
      });
    });

    it('should allow delta', () => {
      const send = sinon.spy();
      const target = {
        handle: 1,
        delta: true,
        session: {
          send,
        },
      };
      const source = {
        GetLayout: { In: [{ Name: 'qId' }], Out: [{ Name: 'qLayout' }] },
      };
      definition.generateDefaultApi(target, source);
      target.getLayout('123', {});
      expect(send).to.have.been.calledWith({
        method: 'GetLayout',
        params: ['123', {}],
        handle: 1,
        delta: true,
        outKey: 'qLayout',
      });
    });
  });

  describe('generate', () => {
    it('should return a definition', () => {
      const entry = definition.generate('Foo');

      expect(entry.def).to.be.an('object');
      expect(entry.def.bar).to.be.a('function');
      // expect( entry.def.proxy ).to.be.a( "function" );
      expect(entry.create).to.be.a('function');
    });

    it('should create an api', () => {
      const entry = definition.generate('Foo');
      const session = {};
      const foo = entry.create(session, 1, 'id', true);
      expect(foo).to.be.an('object');
      expect(foo.session).to.equal(session);
      expect(foo.handle).to.equal(1);
      expect(foo.id).to.equal('id');
    });

    it('should configure types', () => {
      config.schema = {
        structs: {
          Foo: {
            Bar2: { In: [], Out: [] },
          },
        },
      };
      definition = new Schema(config);
      const entry = definition.generate('Foo');
      const session = {};
      const foo = entry.create(session, 1, true);
      expect(foo.bar2).to.be.a('function');
    });
  });

  describe('named parameters', () => {
    beforeEach(() => {
      const json = {
        structs: {
          Foo: {
            Bar: {
              In: [{ Name: 'param1', DefaultValue: '' },
                { Name: 'param2', DefaultValue: '' },
                { Name: 'param3', DefaultValue: 'xyz' }],
              Out: [],
            },
          },
        },
      };
      definition = new Schema({ Promise, schema: json, protocol: { delta: true } });
    });

    it('should call send with the correct parameter set', () => {
      let args;
      const send = (request) => { args = request.params; };
      const api = definition.generate('Foo').create({ send }, 1, 'dummy', false, 'dummy');
      api.bar({ param1: 'abc', param2: 'def', param3: 'ghi' });
      expect(args).to.deep.equal(['abc', 'def', 'ghi']);
      api.bar('abc', 'def');
      expect(args).to.deep.equal(['abc', 'def']);
    });

    it('should fill in default values when parameters are named', () => {
      let args;
      const send = (request) => { args = request.params; };
      const api = definition.generate('Foo').create({ send }, 1, 'dummy', false, 'dummy');
      api.bar({ param1: 'abc', param2: 'def' });
      expect(args).to.deep.equal(['abc', 'def', 'xyz']);
    });

    it('parameters should be passed as an array to mixins', () => {
      let mixinArgs;
      const mixin = { types: 'Foo', override: { bar: (_bar, ...args) => { mixinArgs = args; } } };
      definition.registerMixin(mixin);
      const type = definition.generate('Foo');
      const api = type.create({}, 0, 'id', 'custom');
      api.bar({ param1: 'abc', param2: 'def', param3: 'ghi' });
      expect(mixinArgs).to.deep.equal(['abc', 'def', 'ghi']);
    });
  });
});
