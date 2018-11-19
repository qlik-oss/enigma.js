import Events from './event-emitter';

/**
 * Helper class for handling RPC calls
 * @private
 */
class RPCResolver {
  constructor(id, handle, resolve, reject) {
    Events.mixin(this);
    this.id = id;
    this.handle = handle;
    this.resolve = resolve;
    this.reject = reject;
  }

  resolveWith(data) {
    this.resolve(data);
    this.emit('resolved', this.id);
  }

  rejectWith(err) {
    this.reject(err);
    this.emit('rejected', this.id);
  }
}

export default RPCResolver;
