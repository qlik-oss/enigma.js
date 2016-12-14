import Promise from 'bluebird';
import Schema from '../../../../src/services/qix/schema';
import KeyValueCache from '../../../../src/cache';

describe('Schema', () => {
  it('should be a constructor', () => {
    expect(Schema).to.be.a('function');
    expect(Schema).to.throw();
  });

  it('should add a definition', () => {
    const json = { structs: { Foo: { Bar: { In: [], Out: [] } } } };
    const definition = new Schema(Promise, json);
    expect(definition.def).to.deep.equal(json);
    expect(definition.types).to.be.an.instanceOf(KeyValueCache);
  });

  it('should generate a type', () => {
    const json = { structs: { Foo: { Bar: { In: [], Out: [] } } } };
    const definition = new Schema(Promise, json);
    const type = definition.generate('Foo');
    expect(type.create).to.be.a('function');
    expect(type.def).to.be.an('object');
  });

  it('should throw if type is not defined', () => {
    const json = { structs: { Foo: { Bar: { In: [], Out: [] } } } };
    const definition = new Schema(Promise, json);
    expect(definition.generate.bind(definition, 'Foo1')).to.throw();
  });

  it('should return cached type', () => {
    const json = { structs: { Foo: { Bar: { In: [], Out: [] } } } };
    const definition = new Schema(Promise, json);
    const type = definition.generate('Foo');
    // what kind of test is this??
    expect(definition.generate('Foo')).to.equal(type);
  });

  describe('register mixin', () => {
    const json = { structs: { Foo: { Bar: { In: [], Out: [] } } } };
    let mixin;
    let definition;

    beforeEach(() => {
      mixin = { types: 'Foo', extend: { tweet() { /* dummy*/ } } };
      definition = new Schema(Promise, json);
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
      const api = type.create({}, 0, 'id', true, 'custom');
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
      const obj = type.create({}, 0, 'id', true, 'custom');
      expect(obj.tweet).to.be.a('function');
    });

    it('should only mixin once when type and custom type is equals', () => {
      const spy = sinon.spy(definition, 'mixinType');

      definition.registerMixin('Foo', mixin);
      const type = definition.generate('Foo');
      type.create({}, 0, 'id', true, 'Foo');

      expect(spy.callCount).to.equals(1);
    });

    it('call mixin init function with correct parameters', () => {
      let mixinArgs = {};
      mixin.types = ['custom'];
      mixin.init = function init(initArgs) {
        mixinArgs = initArgs;
      };
      definition.registerMixin(mixin);
      const type = definition.generate('Foo');
      type.create({}, 0, 'id', true, 'custom');
      expect(mixinArgs.Promise).to.be.equal(Promise);
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
    let definition;
    beforeEach(() => {
      const json = null;
      definition = new Schema(Promise, json);
    });

    it('should add method', (done) => {
      const target = {};
      const source = {
        Foo: { In: [], Out: [] },
      };
      definition.generateDefaultApi(target, source);
      sinon.stub(target, 'foo', () => {
        done();
      });
      target.foo();
    });

    it('should call send with correct parameters', () => {
      const send = sinon.spy();
      const target = {
        handle: 1,
        delta: false,
        session: {
          send,
        },
      };
      const source = {
        Foo: { In: [], Out: [] },
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
    const json = { structs: { Foo: { Bar: { In: [], Out: [] } } } };
    it('should return a definition', () => {
      const definition = new Schema(Promise, json);
      const entry = definition.generate('Foo');

      expect(entry.def).to.be.an('object');
      expect(entry.def.bar).to.be.a('function');
      // expect( entry.def.proxy ).to.be.a( "function" );
      expect(entry.create).to.be.a('function');
    });

    it('should create an api', () => {
      const definition = new Schema(Promise, json);
      const entry = definition.generate('Foo');
      const session = {};
      const foo = entry.create(session, 1, 'id', true);
      expect(foo).to.be.an('object');
      expect(foo.session).to.equal(session);
      expect(foo.handle).to.equal(1);
      expect(foo.id).to.equal('id');
      expect(foo.delta).to.equal(true);
    });

    it('should configure types', () => {
      const definition = new Schema(Promise, { structs: {
        Foo: {
          Bar2: { In: [], Out: [] },
        },
      } });
      const entry = definition.generate('Foo');
      const session = {};
      const foo = entry.create(session, 1, true);
      expect(foo.bar2).to.be.a('function');
    });
  });
});
