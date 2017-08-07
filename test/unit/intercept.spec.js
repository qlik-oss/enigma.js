import Promise from 'bluebird';
import Intercept from '../../src/intercept';
import ApiCache from '../../src/api-cache';

describe('Intercept', () => {
  let JSONPatch;
  let intercept;
  let apis;

  beforeEach(() => {
    JSONPatch = { apply() {} };
    apis = new ApiCache();
    intercept = new Intercept({ Promise, JSONPatch, apis, delta: true });
  });

  describe('getPatchee', () => {
    it('should get an existing patchee', () => {
      const patchee = {};
      apis.add(-1, {});
      apis.addPatchee(-1, 'Foo', patchee);
      expect(intercept.getPatchee(-1, [], 'Foo')).to.equal(patchee);
      expect(intercept.getPatchee(-1, [], 'Foo')).to.equal(patchee);
    });

    it('should apply and return a patchee', () => {
      const JSONPatchStub = sinon.stub(JSONPatch, 'apply');
      apis.add(-1, {});
      apis.addPatchee(-1, 'Foo', {});
      intercept.getPatchee(-1, [{ op: 'add', path: '/', value: {} }], 'Foo');
      expect(JSONPatchStub).to.have.been.calledWith({}, [{ op: 'add', path: '/', value: {} }]);

      JSONPatchStub.reset();

      apis.addPatchee(-1, 'Bar', []);
      intercept.getPatchee(-1, [{ op: 'add', path: '/', value: [] }], 'Bar');
      expect(JSONPatchStub).to.have.been.calledWith([], [{ op: 'add', path: '/', value: [] }]);

      JSONPatchStub.reset();

      // primitive
      apis.addPatchee(-1, 'Baz', 'my folder');
      intercept.getPatchee(-1, [{ op: 'add', path: '/', value: ['my documents'] }], 'Baz');
      expect(JSONPatchStub.callCount).to.equal(0);
    });

    describe('primitive patch', () => {
      let value;

      beforeEach(() => {
        apis.add(-1, {});
      });

      describe('add', () => {
        const op = 'add';

        it('should return a string', () => {
          value = intercept.getPatchee(-1, [{ op, path: '/', value: 'A string' }], 'Foo');
          expect(value).to.equal('A string');
        });

        it('should return a boolean', () => {
          value = intercept.getPatchee(-1, [{ op, path: '/', value: true }], 'Foo');
          expect(value).to.equal(true);
        });

        it('should return a number', () => {
          value = intercept.getPatchee(-1, [{ op, path: '/', value: 123 }], 'Foo');
          expect(value).to.equal(123);
        });
      });

      describe('replace', () => {
        const op = 'replace';

        it('should return a string', () => {
          value = intercept.getPatchee(-1, [{ op, path: '/', value: 'A string' }], 'Foo');
          expect(value).to.equal('A string');
        });

        it('should return a boolean', () => {
          value = intercept.getPatchee(-1, [{ op, path: '/', value: true }], 'Foo');
          expect(value).to.equal(true);
        });

        it('should return a number', () => {
          value = intercept.getPatchee(-1, [{ op, path: '/', value: 123 }], 'Foo');
          expect(value).to.equal(123);
        });
      });

      it('should cache primitive patches', () => {
        value = intercept.getPatchee(-1, [{ op: 'add', path: '/', value: 'A string' }], 'Foo');
        expect(value).to.equal('A string');
        expect(intercept.getPatchee(-1, [], 'Foo')).to.equal(value);
      });

      it('should not throw if primitive patch already exists', () => {
        intercept.getPatchee(-1, [{ op: 'add', path: '/', value: 'A string' }], 'Foo');
        expect(intercept.getPatchee(-1, [{ op: 'replace', path: '/', value: 'Bar' }], 'Foo')).to.equal('Bar');
      });
    });
  });

  describe('intercept', () => {
    it('should call interceptors onFulfilled', () => {
      intercept.interceptors = [{ onFulfilled: sinon.stub().returns({ bar: {} }) }];
      return expect(intercept.execute(Promise.resolve({ foo: {} })))
        .to.eventually.deep.equal({ bar: {} });
    });

    it('should reject and stop the interceptor chain', () => {
      const spyFulFilled = sinon.spy();
      intercept.interceptors = [{ onFulfilled() { return Promise.reject('foo'); } }, { onFulfilled: spyFulFilled }];
      return expect(intercept.execute(Promise.resolve()).then(() => {}, (err) => {
        expect(spyFulFilled.callCount).to.equal(0);
        return Promise.reject(err);
      })).to.eventually.be.rejectedWith('foo');
    });

    it('should call interceptors onRejected', () => {
      const onRejected = sinon.stub().returns('foo');
      intercept.interceptors = [{ onFulfilled() { return Promise.reject('foo'); } }, { onFulfilled() {}, onRejected }];
      return expect(intercept.execute(Promise.resolve(), {})).to.eventually.equal('foo');
    });
  });

  describe('processErrorInterceptor', () => {
    it('should reject and emit if the response contains an error', () => intercept.processErrorInterceptor({}, { error: { code: 2, parameter: 'param', message: 'msg' } }).then(null, (err) => {
      expect(err instanceof Error).to.equal(true);
      expect(err.code).to.equal(2);
      expect(err.parameter).to.equal('param');
      expect(err.message).to.equal('msg');
      expect(err.stack).to.be.a('string');
      // check if the test file is included in the stack trace:
      expect(err.stack.indexOf('intercept.spec.js')).to.not.equal(-1);
    }));

    it('should not reject if the response does not contain any error', () => {
      const response = {};
      expect(intercept.processErrorInterceptor({}, response)).to.equal(response);
    });
  });

  describe('processDeltaInterceptor', () => {
    let response = { result: { foo: {} } };

    it('should call getPatchee', () => {
      response = { result: { qReturn: [{ foo: {} }] }, delta: true };
      const stub = sinon.stub(intercept, 'getPatchee').returns(response.result.qReturn);
      intercept.processDeltaInterceptor({ handle: 1, method: 'Foo', outKey: -1 }, response);
      expect(stub).to.have.been.calledWith(1, response.result.qReturn, 'Foo-qReturn');
    });

    it('should reject when response is not an array of patches', () => {
      response = { result: { qReturn: { foo: {} } }, delta: true };
      return expect(intercept.processDeltaInterceptor({ handle: 1, method: 'Foo', outKey: -1 }, response)).to.eventually.be.rejectedWith('Unexpected rpc response, expected array of patches');
    });

    it('should return response if delta is falsy', () => {
      response = { result: { qReturn: [{ foo: {} }] }, delta: false };
      expect(intercept.processDeltaInterceptor({ handle: 1, method: 'Foo', outKey: -1 }, response)).to.equal(response);
    });
  });

  describe('processResultInterceptor', () => {
    const response = { result: { foo: {} } };

    it('should return result', () => {
      expect(intercept.processResultInterceptor({ outKey: -1 }, response))
        .to.be.equal(response.result);
    });
  });

  describe('processMultipleOutParamInterceptor', () => {
    it('should append missing qGenericId for CreateSessionApp', () => {
      const result = { qReturn: { qHandle: 1, qType: 'Doc' }, qSessionAppId: 'test' };
      const out = intercept.processMultipleOutParamInterceptor({ method: 'CreateSessionApp' }, result);
      expect(out.qReturn.qGenericId).to.be.equal(result.qSessionAppId);
    });

    it('should remove errenous qReturn from GetInteract', () => {
      const result = { qReturn: false, qDef: 'test' };
      const out = intercept.processMultipleOutParamInterceptor({ method: 'GetInteract' }, result);
      expect(out.qReturn).to.be.equal(undefined);
    });
  });

  describe('processOutInterceptor', () => {
    it('should return result with out key', () => {
      const result = { foo: { bar: {} } };
      expect(intercept.processOutInterceptor({ outKey: 'foo' }, result)).to.be.equal(result.foo);
    });

    it('should return result with return key', () => {
      const result = { qReturn: { foo: {} } };
      expect(intercept.processOutInterceptor({ outKey: -1 }, result)).to.be.equal(result.qReturn);
    });

    it('should return result if neither out key or return key is specified', () => {
      const result = { foo: {} };
      expect(intercept.processOutInterceptor({ outKey: -1 }, result)).to.be.equal(result);
    });
  });
});
