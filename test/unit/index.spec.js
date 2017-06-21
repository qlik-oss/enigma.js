import api from '../../src/index';
import Registry from '../../src/registry';

describe('index main file', () => {
  it('should return a Registry instance', () => {
    expect(api).to.be.instanceOf(Registry);
  });
  it('should have a qix service as default', () => {
    const qixService = api.services.get('qix');
    expect(qixService).to.be.a('function');
  });
});
