import EventEmitter from 'node-event-emitter';

export default {
  mixin: (obj) => {
    Object.keys(EventEmitter.prototype).forEach((key) => {
      obj[key] = EventEmitter.prototype[key];
    });
    EventEmitter.init(obj);
  },
};
