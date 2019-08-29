import resultInterceptor from '../../../src/interceptors/result-response-interceptor';

describe('Response interceptor: Result', () => {
  const response = { result: { foo: {} } };

  it('should return result', () => {
    expect(resultInterceptor({}, { outKey: -1 }, response))
      .to.be.equal(response.result);
  });
});
