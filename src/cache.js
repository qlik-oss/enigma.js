/**
* Key-value cache
*/
class KeyValueCache {
  constructor() {
    this.entries = {};
  }

  /**
  * Adds an entry.
  * @function KeyValueCache#add
  * @param {String} key The key representing an entry.
  * @param {*} entry The entry to be added.
  */
  add(key, entry) {
    key += '';
    if (typeof this.entries[key] !== 'undefined') {
      throw new Error(`Entry already defined with key ${key}`);
    }
    this.entries[key] = entry;
  }

  /**
  * Sets an entry.
  * @function KeyValueCache#set
  * @param {String} key The key representing an entry.
  * @param {*} entry The entry.
  */
  set(key, entry) {
    key += '';
    this.entries[key] = entry;
  }

  /**
  * Removes an entry.
  * @function KeyValueCache#remove
  * @param {String} key The key representing an entry.
  */
  remove(key) {
    delete this.entries[key];
  }

  /**
  * Gets an entry.
  * @function KeyValueCache#get
  * @param {String} key The key representing an entry.
  * @returns {*} The entry for the key.
  */
  get(key) {
    return this.entries[key];
  }

  /**
  * Gets a list of all entries.
  * @function KeyValueCache#getAll
  * @returns {Array} The list of entries including its `key` and `value` properties.
  */
  getAll() {
    return Object.keys(this.entries).map(key =>
      ({
        key,
        value: this.entries[key],
      }),
    );
  }

  /**
  * Gets a key for an entry.
  * @function KeyValueCache#getKey
  * @param {*} entry The entry to locate the key for.
  * @returns {String} The key representing an entry.
  */
  getKey(entry) {
    return Object.keys(this.entries).filter(key =>
      this.entries[key] === entry,
    )[0];
  }

  /**
  * Clears the cache of all entries.
  * @function KeyValueCache#clear
  */
  clear() {
    this.entries = {};
  }
}

export default KeyValueCache;
