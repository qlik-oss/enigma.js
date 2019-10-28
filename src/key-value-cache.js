import createEnigmaError from './error';
import errorCodes from './error-codes';

/**
* Key-value cache
* @private
*/
class KeyValueCache {
  constructor() {
    this.entries = {};
  }

  /**
  * Adds an entry.
  * @private
  * @function KeyValueCache#add
  * @param {String} key The key representing an entry.
  * @param {*} entry The entry to be added.
  */
  add(key, entry) {
    key += '';
    if (typeof this.entries[key] !== 'undefined') {
      throw createEnigmaError(errorCodes.ENTRY_ALREADY_DEFINED, `Entry already defined with key ${key}`);
    }
    this.entries[key] = entry;
  }

  /**
  * Sets an entry.
  * @private
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
  * @private
  * @function KeyValueCache#remove
  * @param {String} key The key representing an entry.
  */
  remove(key) {
    delete this.entries[key];
  }

  /**
  * Gets an entry.
  * @private
  * @function KeyValueCache#get
  * @param {String} key The key representing an entry.
  * @returns {*} The entry for the key.
  */
  get(key) {
    return this.entries[key];
  }

  /**
  * Gets a list of all entries.
  * @private
  * @function KeyValueCache#getAll
  * @returns {Array} The list of entries including its `key` and `value` properties.
  */
  getAll() {
    return Object.keys(this.entries).map((key) => ({
      key,
      value: this.entries[key],
    }));
  }

  /**
  * Gets a key for an entry.
  * @private
  * @function KeyValueCache#getKey
  * @param {*} entry The entry to locate the key for.
  * @returns {String} The key representing an entry.
  */
  getKey(entry) {
    return Object.keys(this.entries).filter((key) => this.entries[key] === entry)[0];
  }

  /**
  * Clears the cache of all entries.
  * @private
  * @function KeyValueCache#clear
  */
  clear() {
    this.entries = {};
  }
}

export default KeyValueCache;
