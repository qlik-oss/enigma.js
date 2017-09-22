import apiInterceptor from '../../../../src/interceptors/response/api';

describe('Response interceptor: API', () => {
  it('should generate api if handle/type exists', () => {
    const session = { getObjectApi: sinon.stub().returns('dummy') };
    const response = { qHandle: 1, qType: 'Doc', qGenericId: '123' };
    const out = apiInterceptor(session, {}, response);
    expect(session.getObjectApi.called).to.equal(true);
    expect(out).to.equal('dummy');
  });

  it('should throw error when handle/type is null', () => {
    const session = { getObjectApi: sinon.stub().returns('dummy') };
    const response = { qHandle: null, qType: null };
    expect(() => apiInterceptor(session, {}, response)).to.throw();
  });

  it('should leave response untouched if handle/type is missing', () => {
    const response = { foo: { bar: {} } };
    const out = apiInterceptor({}, {}, response);
    expect(out).to.equal(response);
  });
});
