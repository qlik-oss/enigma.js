import ApiCache from '../../src/api-cache';

describe('ApiCache', () => {
  let apiCache;
  let definition;

  const createApi = (template, on, emit) => {
    const api = {
      on: on || sinon.stub(),
      emit: emit || sinon.stub(),
      removeAllListeners: () => {},
    };
    return Object.assign(api, template || {});
  };

  beforeEach(() => {
    definition = {
      generate: sinon.stub().returnsThis(),
      create: sinon.stub().returnsArg(1),
    };
    apiCache = new ApiCache({ definition });
    apiCache.session = {};
  });

  it('should be a constructor', () => {
    expect(ApiCache).to.be.a('function');
    expect(ApiCache).to.throw();
  });

  it('should add an api', () => {
    const api = createApi();
    const entry = apiCache.add(1, api);
    expect(apiCache.entries['1']).to.equal(entry);
  });

  it('should get an api', () => {
    const api = createApi();
    apiCache.add(1, api);
    expect(apiCache.getApi(1)).to.equal(api);
  });

  it('should return an undefined api if an api is not found', () => {
    const api = createApi();
    apiCache.add(1, api);
    expect(apiCache.getApi(2)).to.equal(undefined);
  });

  it('should return an undefined api if given an undefined handle', () => {
    const api = createApi();
    apiCache.add(1, api);
    expect(apiCache.getApi(undefined)).to.equal(undefined);
  });

  it('should get all api entries', () => {
    const api1 = createApi({ a: 'foo' });
    const api2 = createApi({ a: 'bar' });
    apiCache.add('0', api1);
    apiCache.add('1', api2);

    const entries = apiCache.getApis();
    expect(entries).to.be.an('Array');
    expect(entries.length).to.equal(2);
    expect(entries[0].handle).to.equal('0');
    expect(entries[0].api.a).to.equal('foo');
    expect(entries[1].handle).to.equal('1');
    expect(entries[1].api.a).to.equal('bar');
  });
});
