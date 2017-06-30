import KeyValueCache from '../../src/cache';

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
