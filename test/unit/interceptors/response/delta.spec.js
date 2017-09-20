import ApiCache from '../../../../src/api-cache';
import deltaInterceptor from '../../../../src/interceptors/response/delta';

describe('Response interceptor: Delta', () => {
  let apis;
  let response;

  beforeEach(() => {
    apis = new ApiCache();
    response = { result: { foo: {} } };
  });

  it('should reject when response is not an array of patches', () => {
    response = { result: { qReturn: { foo: {} } }, delta: true };
    return expect(() => deltaInterceptor({ apis }, { handle: 1, method: 'Foo', outKey: -1 }, response)).to.throw('Unexpected rpc response, expected array of patches');
  });

  it('should return response if delta is falsy', () => {
    response = { result: { qReturn: [{ foo: {} }] }, delta: false };
    expect(deltaInterceptor({ apis }, { handle: 1, method: 'Foo', outKey: -1 }, response)).to.equal(response);
  });
});
