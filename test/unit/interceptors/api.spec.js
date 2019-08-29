import apiInterceptor from '../../../src/interceptors/api-response-interceptor';

// eslint-disable-next-line no-restricted-globals
const session = { config: { Promise }, getObjectApi: sinon.stub().returns('dummy') };

describe('Response interceptor: API', () => {
  it('should generate api if handle/type exists', () => {
    const response = { qHandle: 1, qType: 'Doc', qGenericId: '123' };
    const out = apiInterceptor(session, {}, response);
    expect(session.getObjectApi.called).to.equal(true);
    expect(out).to.equal('dummy');
  });

  it('should return rejected promise when handle/type is null', () => {
    const response = { qHandle: null, qType: null };
    return apiInterceptor(session, {}, response).catch((err) => expect(err).to.be.an('error'));
  });

  it('should leave response untouched if handle/type is missing', () => {
    const response = { foo: { bar: {} } };
    const out = apiInterceptor(session, {}, response);
    expect(out).to.equal(response);
  });
});
