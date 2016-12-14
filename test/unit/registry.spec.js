import Registry from '../../src/registry';
import KeyValueCache from '../../src/cache';

describe('Registry', () => {
  let registry;

  const serviceFn = () => 'donald duck api';

  beforeEach(() => {
    registry = new Registry();
  });

  it('should have a constructor', () => {
    expect(Registry).to.be.a('function');
    expect(Registry).to.throw();
  });

  it('should set instance variables', () => {
    expect(registry.services).to.be.instanceof(KeyValueCache);
  });

  it('should add a service', () => {
    const spy = sinon.spy(registry.services, 'add');
    registry.registerService('foo', serviceFn);
    expect(spy).to.have.been.calledWith('foo', serviceFn);
  });

  it('should get service api instance', () => {
    const connect = sinon.spy();
    registry.registerService('foo', connect);
    const a = { a: 'mickey' };
    const b = { b: 'mouse' };
    registry.getService('foo', a, b);
    expect(connect).to.have.been.calledWithMatch({ a: 'mickey', b: 'mouse' });
  });
});
