import KeyValueCache from './cache';

class ApiCache extends KeyValueCache {
  add(handle, api) {
    const entry = { api };
    super.add(handle.toString(), entry);
    api.on('closed', () => this.remove(handle));
    return entry;
  }

  getApi(handle) {
    const entry = typeof handle !== 'undefined' ? this.get(handle.toString()) : undefined;
    return entry && entry.api;
  }

  getApis() {
    return super.getAll().map(entry =>
      ({
        handle: entry.key,
        api: entry.value.api,
      }));
  }

  getApisByType(type) {
    return this.getApis().filter(entry => entry.api.type === type);
  }
}

export default ApiCache;
