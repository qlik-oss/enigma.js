import Events from './event-emitter';

class RPCResolver {
  constructor(id, resolve, reject) {
    Events.mixin(this);
    this.id = id;
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
