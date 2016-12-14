import Events from '../../src/event-emitter';

describe('EventEmitter', () => {
  it('should add events', () => {
    const obj = {};
    Events.mixin(obj);
    expect(obj.addListener).to.be.a('function');
    expect(obj.on).to.be.a('function');
    expect(obj.once).to.be.a('function');
    expect(obj.removeListener).to.be.a('function');
    expect(obj.removeAllListeners).to.be.a('function');
    expect(obj.emit).to.be.a('function');
  });
});
