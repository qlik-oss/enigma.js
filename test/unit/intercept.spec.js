import Promise from 'bluebird';
import Intercept from '../../src/intercept';
import ApiCache from '../../src/api-cache';

describe('Intercept', () => {
  let intercept;
  let apis;
  let session;

  beforeEach(() => {
    apis = new ApiCache();
    session = { config: { Promise } };
    intercept = new Intercept({ Promise, apis });
  });

  describe('intercept', () => {
    it('should call interceptors onFulfilled', () => {
      intercept.response = [{ onFulfilled: sinon.stub().returns({ bar: {} }) }];
      return expect(intercept.executeResponses(session, Promise.resolve({ foo: {} })))
        .to.eventually.deep.equal({ bar: {} });
    });

    it('should reject and stop the interceptor chain', () => {
      const spyFulFilled = sinon.spy();
      intercept.response = [{ onFulfilled() { return Promise.reject(new Error('foo')); } }, { onFulfilled: spyFulFilled }];
      return expect(intercept.executeResponses(session, Promise.resolve()).then(() => {}, (err) => {
        expect(spyFulFilled.callCount).to.equal(0);
        return Promise.reject(err);
      })).to.eventually.be.rejectedWith('foo').and.be.an.instanceOf(Error);
    });

    it('should call interceptors onRejected', () => {
      const onRejected = sinon.stub().returns('foo');
      intercept.response = [
        { onFulfilled() { return Promise.reject(new Error('should never happen!')); } },
        { onFulfilled() {}, onRejected },
      ];
      return expect(intercept.executeResponses(session, Promise.resolve(), {})).to.eventually.equal('foo');
    });

    it('should call api interceptor at last', () => {
      const response = {
        jsonrpc: '2.0',
        id: 3,
        result: {
          qReturn: {
            qType: null,
            qHandle: null,
          },
        },
      };
      const dummyInterceptor = { onFulfilled: (a, b, c) => c, onRejected: sinon.stub() };
      intercept = new Intercept({ Promise, apis, response: [dummyInterceptor] });
      const interceptedResponse = intercept.executeResponses(
        { config: { Promise } },
        Promise.resolve(response),
        {},
      );
      return expect(interceptedResponse).to.eventually.be.rejectedWith('Object not found')
        .then(() => expect(dummyInterceptor.onRejected.callCount).to.equal(0));
    });
  });
});
