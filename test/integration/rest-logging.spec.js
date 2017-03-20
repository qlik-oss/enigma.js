import chaiSubset from 'chai-subset';
import Enigma from '../../src/index';

chai.use(chaiSubset);

describe('rest-logging', () => {
  let sandbox;
  let aboutService;
  let logSpy;
  before(() => {
    sandbox = sinon.sandbox.create();
    logSpy = sandbox.spy();

    const cfg = {
      unsecure: true,
      host: 'localhost',
      port: 4848,
      headers: { 'x-qlik-capabilities': 'about' },
      handleLog: logSpy,
      services: [{ id: 'about', version: 'v1' }],
    };

    return Enigma.getService('rest', cfg).then((services) => {
      aboutService = services.about;
    });
  });

  after(() => {
    sandbox.restore();
  });

  it('should log rest traffic', () =>
    aboutService.apis.default.get_v1_components({ 'x-qlik-capabilities': 'about' }).then((components) => {
      // Verify that the service responds what we expect first
      expect(Array.isArray(components.obj));
      expect(components.obj.filter(item => item.component === 'QIX Engine').length).to.equal(1);

      // Verify that the log spy has received the request and response
      // (skip first two logs since that's the open api json being fetched)
      expect(logSpy.getCall(2).args[0]).to.containSubset({
        msg: 'Request',
        req: {
          host: 'localhost',
          port: '4848',
          path: '/api/about/v1/components',
          method: 'GET',
          headers: {} } });
      expect(logSpy.getCall(3).args[0]).to.containSubset({
        msg: 'Response',
        res: { } });
      // Extra check to see that the data contains what we expect
      expect(logSpy.getCall(3).args[0].res.data).to.contain('QIX Engine');
    })
  );
});
