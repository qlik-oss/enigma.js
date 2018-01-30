import enigma from '../../src/index';
import utils from './utils';

describe('qix-logging', () => {
  let qixGlobal;
  let sandbox;
  let sentSpy;
  let receivedSpy;
  let starSpy;

  before(() => {
    const config = utils.getDefaultConfig();
    sandbox = sinon.sandbox.create();
    const session = enigma.create(config);
    sentSpy = sinon.spy();
    receivedSpy = sinon.spy();
    starSpy = sinon.spy();
    session.on('traffic:sent', sentSpy);
    session.on('traffic:received', receivedSpy);
    session.on('traffic:*', starSpy);

    return session.open().then((global) => {
      qixGlobal = global;
    });
  });

  after(() => {
    sandbox.restore();
    return qixGlobal.session.close();
  });

  it('should log qix traffic', () => {
    const request = {
      method: 'AllowCreateApp',
      handle: -1,
      params: [],
      id: 1,
    };
    const response = {
      id: 1,
      jsonrpc: '2.0',
      result: {
        qReturn: true,
      },
    };

    const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));
    return delay(100).then(() => qixGlobal.allowCreateApp()).then(() => {
      // we have traffic:received for OnConnected notification before (so second received
      // msg should be ours):
      expect(sentSpy.firstCall.args[0]).to.containSubset(request);
      expect(receivedSpy.secondCall.args[0]).to.containSubset(response);
      expect(starSpy.secondCall.args[0]).to.equal('sent');
      expect(starSpy.secondCall.args[1]).to.containSubset(request);
      expect(starSpy.thirdCall.args[0]).to.equal('received');
      expect(starSpy.thirdCall.args[1]).to.containSubset(response);
    });
  });
});
