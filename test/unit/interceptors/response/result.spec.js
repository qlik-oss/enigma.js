import resultInterceptor from '../../../../src/interceptors/response/result';

describe('Response interceptor: Result', () => {
  const response = { result: { foo: {} } };

  it('should return result', () => {
    expect(resultInterceptor({}, { outKey: -1 }, response))
      .to.be.equal(response.result);
  });
});
