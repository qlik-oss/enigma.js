import ApiCache from '../../../../src/api-cache';
import deltaInterceptor from '../../../../src/interceptors/response/delta';

describe('Response interceptor: Delta', () => {
  let request;
  let response;
  let session;

  beforeEach(() => {
    session = {
      id: 'test-session-id',
      apis: new ApiCache(),
      on: sinon.spy(),
    };
    request = {
      handle: 1, method: 'Foo', outKey: -1, delta: true,
    };
    response = {
      result: { qReturn: { foo: {} } }, delta: true,
    };
    Object.keys(deltaInterceptor.sessions).forEach(key => delete deltaInterceptor.sessions[key]);
  });

  it('should throw when response is not an array of patches', () => expect(() => deltaInterceptor(session, request, response)).to.throw('Unexpected RPC response, expected array of patches'));

  it('should return response if delta is falsy', () => {
    response.delta = false;
    expect(deltaInterceptor(session, request, response)).to.equal(response);
  });

  it('should patch if response contains valid object-references', () => {
    response = { result: { qReturn: [{ op: 'add', path: '/', value: { hello: 'world!' } }] }, delta: true };
    const value = deltaInterceptor(session, request, response);
    expect(value).to.containSubset({ result: { qReturn: { hello: 'world!' } } });
  });

  it('should patch if response contains a simple property', () => {
    const result = { result: { qReturn: false } };
    response = { result: { qReturn: [{ op: 'add', path: '/', value: false }] }, delta: true };
    const value1 = deltaInterceptor(session, request, response);
    expect(value1).to.containSubset(result);

    response = { result: { qReturn: [] }, delta: true };
    const value2 = deltaInterceptor(session, request, response);
    expect(value2).to.containSubset(result);
  });

  it('should remove cache if a handle is closed', () => {
    response = { result: { qReturn: [{ op: 'add', path: '/', value: 'hello world!' }] }, delta: true };
    deltaInterceptor(session, request, response);
    const cache = deltaInterceptor.sessions[session.id];
    expect(Object.keys(cache).length).to.equal(1);
    // invoke event handler for 'traffic:received' event:
    session.on.firstCall.args[1]({ close: [1] });
    expect(Object.keys(cache).length).to.equal(0);
  });

  it('should remove caches if a session is closed', () => {
    response = { result: { qReturn: [{ op: 'add', path: '/', value: 'hello world!' }] }, delta: true };
    deltaInterceptor(session, request, response);
    expect(Object.keys(deltaInterceptor.sessions).length).to.equal(1);
    // invoke event handler for 'closed' event:
    session.on.secondCall.args[1]();
    expect(Object.keys(deltaInterceptor.sessions).length).to.equal(0);
  });
});
