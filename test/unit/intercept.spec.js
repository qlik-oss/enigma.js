import Promise from 'bluebird';
import Intercept from '../../src/intercept';
import ApiCache from '../../src/api-cache';

describe('Intercept', () => {
  let intercept;
  let apis;

  beforeEach(() => {
    apis = new ApiCache();
    intercept = new Intercept({ Promise, apis });
  });

  describe('intercept', () => {
    it('should call interceptors onFulfilled', () => {
      intercept.response = [{ onFulfilled: sinon.stub().returns({ bar: {} }) }];
      return expect(intercept.executeResponses({}, Promise.resolve({ foo: {} })))
        .to.eventually.deep.equal({ bar: {} });
    });

    it('should reject and stop the interceptor chain', () => {
      const spyFulFilled = sinon.spy();
      intercept.response = [{ onFulfilled() { return Promise.reject(new Error('foo')); } }, { onFulfilled: spyFulFilled }];
      return expect(intercept.executeResponses({}, Promise.resolve()).then(() => {}, (err) => {
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
      return expect(intercept.executeResponses({}, Promise.resolve(), {})).to.eventually.equal('foo');
    });
  });
});
