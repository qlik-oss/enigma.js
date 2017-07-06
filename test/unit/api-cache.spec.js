import ApiCache from '../../src/api-cache';

describe('ApiCache', () => {
  let apiCache;
  let definition;

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
    const api = {};
    const entry = apiCache.add(1, api);
    expect(apiCache.entries['1']).to.equal(entry);
  });

  it('should get an api', () => {
    const api = {};
    apiCache.add(1, api);
    expect(apiCache.getApi(1)).to.equal(api);
  });

  it('should return an undefined api if an api is not found', () => {
    const api = {};
    apiCache.add(1, api);
    expect(apiCache.getApi(2)).to.equal(undefined);
  });

  it('should return an undefined api if given an undefined handle', () => {
    const api = {};
    apiCache.add(1, api);
    expect(apiCache.getApi(undefined)).to.equal(undefined);
  });

  it('should get all api entries', () => {
    apiCache.add('1', 'foo');
    apiCache.add('2', 'bar');

    const entries = apiCache.getApis();
    expect(entries).to.be.an('Array');
    expect(entries.length).to.equal(2);
    expect(entries[1]).to.deep.equal({ handle: '2', api: 'bar' });
  });

  it('should get a patchee', () => {
    const api = {};
    const patchee = {};
    apiCache.add(1, api);
    apiCache.addPatchee(1, 'method', patchee);
    expect(apiCache.getPatchee(1, 'method')).to.equal(patchee);
  });

  it('should add a patchee', () => {
    const api = {};
    const patchee = {};
    const entry = apiCache.add(1, api);
    apiCache.addPatchee(1, 'method', patchee);
    expect(entry.deltaCache.entries.method).to.equal(patchee);
  });


  it('should emit changed on handle changed', () => {
    const api = {
      emit: sinon.spy(),
    };
    apiCache.add(10, api);
    apiCache.onHandleChanged(10);
    expect(api.emit).to.have.been.calledWith('changed');
  });

  it('should emit closed on handle closed', () => {
    const api = {
      emit: sinon.spy(),
      removeAllListeners: () => {},
    };
    apiCache.add(10, api);
    apiCache.onHandleClosed(10);
    expect(api.emit).to.have.been.calledWith('closed');
  });

  it('should remove api on handle closed', () => {
    const api = {
      emit: sinon.spy(),
      removeAllListeners: () => {},
    };
    const remove = sinon.spy(apiCache, 'remove');
    apiCache.add(10, api);
    apiCache.onHandleClosed(10);
    expect(remove).to.have.been.calledWith(10);
  });

  it('should not try to remove unexisting api on handle closed', () => {
    const remove = sinon.spy(apiCache, 'remove');
    apiCache.onHandleClosed(10);
    expect(remove.callCount).to.equal(0);
  });

  it('should emit closed on close', () => {
    const api2 = {
      emit: sinon.spy(),
      removeAllListeners: () => {},
    };
    apiCache.add(20, api2);
    apiCache.onSessionClosed();
    expect(api2.emit).to.have.been.calledWith('closed');
    expect(apiCache.getAll().length).to.be.equal(0);
  });
});
