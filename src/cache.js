class KeyValueCache {
  constructor() {
    this.entries = {};
  }

  add(key, entry) {
    key += '';
    if (typeof this.entries[key] !== 'undefined') {
      throw new Error(`Entry already defined with key ${key}`);
    }
    this.entries[key] = entry;
  }

  set(key, entry) {
    key += '';
    this.entries[key] = entry;
  }

  remove(key) {
    delete this.entries[key];
  }

  get(key) {
    return this.entries[key];
  }

  getAll() {
    return Object.keys(this.entries).map(key =>
      ({
        key,
        value: this.entries[key],
      }));
  }

  getKey(entry) {
    return Object.keys(this.entries).filter(key =>
      this.entries[key] === entry)[0];
  }

  clear() {
    this.entries = {};
  }
}

export default KeyValueCache;
