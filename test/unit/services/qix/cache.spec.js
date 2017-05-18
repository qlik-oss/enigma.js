import KeyValueCache from '../../../../src/cache';
import ApiCache from '../../../../src/services/qix/api-cache';

describe('Cache', () => {
  describe('KeyValueCache', () => {
    let keyValueCache;

    beforeEach(() => {
      keyValueCache = new KeyValueCache();
    });

    it('should be a constructor', () => {
      expect(KeyValueCache).to.be.a('function');
      expect(KeyValueCache).to.throw();
    });

    it('should set instance variables', () => {
      expect(keyValueCache.entries).to.be.an('object');
    });

    it('should add an entry', () => {
      keyValueCache.add('foo', 'bar');
      expect(keyValueCache.entries.foo).to.equal('bar');
      expect(keyValueCache.add.bind(keyValueCache, 'foo')).to.throw();
    });

    it('should remove an entry', () => {
      keyValueCache.add('foo', 'bar');
      expect(keyValueCache.entries.foo).to.equal('bar');
      keyValueCache.remove('foo');
      expect(Object.prototype.hasOwnProperty.call(keyValueCache.entries, 'foo')).to.equal(false);
    });

    it('should get an entry', () => {
      keyValueCache.add('foo', 'bar');
      expect(keyValueCache.get('foo')).to.equal('bar');
    });

    it('should find the key for entry', () => {
      keyValueCache.add('foo', 'bar');
      expect(keyValueCache.getKey('bar')).to.equal('foo');
    });

    it('should get all entries', () => {
      keyValueCache.add('foo1', 'bar1');
      keyValueCache.add('foo2', 'bar2');

      const entries = keyValueCache.getAll();
      expect(entries).to.be.an('Array');
      expect(entries.length).to.equal(2);
      expect(entries[0]).to.deep.equal({ key: 'foo1', value: 'bar1' });
    });

    it('should clear all entries', () => {
      keyValueCache.add('foo', 'bar');
      keyValueCache.add('foo1', 'bar1');
      expect(Object.keys(keyValueCache.entries)).to.have.length(2);
      keyValueCache.clear();
      expect(Object.keys(keyValueCache.entries)).to.have.length(0);
    });
  });

  describe('ApiCache', () => {
    let apiCache;

    beforeEach(() => {
      apiCache = new ApiCache();
    });

    it('should be a constructor', () => {
      expect(ApiCache).to.be.a('function');
      expect(ApiCache).to.throw();
    });

    it('should be able to pre-populate the cache', () => {
      const apis = [{ handle: '0', value: 'foo' }, { handle: '1', value: 'bar' }];
      apiCache = new ApiCache(apis);
      expect(apiCache.getApis().length).to.equal(2);
      expect(apiCache.entries['0'].api).to.deep.equal(apis[0]);
      expect(apiCache.entries['1'].api).to.deep.equal(apis[1]);
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
  });
});
