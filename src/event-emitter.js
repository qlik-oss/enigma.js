import EventEmitter from 'node-event-emitter';

/**
* @module EventEmitter
* @private
*/
export default {

  /**
  * Function used to add event handling to objects passed in.
  * @param {Object} obj Object instance that will get event handling.
  */
  mixin: (obj) => {
    Object.keys(EventEmitter.prototype).forEach((key) => {
      obj[key] = EventEmitter.prototype[key];
    });
    EventEmitter.init(obj);
  },
};
