import outParamInterceptor from '../../../src/interceptors/out-param-response-interceptor';

describe('Response interceptor: Out param', () => {
  it('should append missing qGenericId for CreateSessionApp', () => {
    const result = { qReturn: { qHandle: 1, qType: 'Doc' }, qSessionAppId: 'test' };
    const out = outParamInterceptor({}, { method: 'CreateSessionApp' }, result);
    expect(out.qGenericId).to.be.equal(result.qSessionAppId);
  });

  it('should remove errenous qReturn from GetInteract', () => {
    const result = { qReturn: false, qDef: 'test' };
    const out = outParamInterceptor({}, { method: 'GetInteract', outKey: 'qDef' }, result);
    expect(out).to.be.equal(result.qDef);
  });

  it('should return result with out key', () => {
    const result = { foo: { bar: {} } };
    expect(outParamInterceptor({}, { outKey: 'foo' }, result)).to.be.equal(result.foo);
  });

  it('should return result with return key', () => {
    const result = { qReturn: { foo: {} } };
    expect(outParamInterceptor(
      {},
      { outKey: -1 },
      result,
    )).to.be.equal(result.qReturn);
  });

  it('should return result if neither out key or return key is specified', () => {
    const result = { foo: {} };
    expect(outParamInterceptor({}, { outKey: -1 }, result)).to.be.equal(result);
  });
});
