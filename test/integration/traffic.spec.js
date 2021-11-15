import enigma from '../../src/enigma';
import utils from './utils';

describe('qix-logging', () => {
  let qixGlobal;
  let sandbox;
  let sentSpy;
  let receivedSpy;
  let starSpy;
  let apiSentSpy;
  let apiReceivedSpy;
  let apiStarSpy;

  before(() => {
    const config = utils.getDefaultConfig();
    sandbox = sinon.createSandbox();
    const session = enigma.create(config);
    sentSpy = sinon.spy();
    receivedSpy = sinon.spy();
    starSpy = sinon.spy();
    session.on('traffic:sent', sentSpy);
    session.on('traffic:received', receivedSpy);
    session.on('traffic:*', starSpy);

    return session.open().then((global) => {
      apiSentSpy = sinon.spy();
      apiReceivedSpy = sinon.spy();
      apiStarSpy = sinon.spy();
      qixGlobal = global;
      qixGlobal.on('traffic:sent', apiSentSpy);
      qixGlobal.on('traffic:received', apiReceivedSpy);
      qixGlobal.on('traffic:*', apiStarSpy);
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

    // the delay is to guarantee we don't get a race condition
    // between or first request and the 'OnConnected' notification:
    const delay = (t) => new Promise((r) => { setTimeout(r, t); });
    return delay(100).then(() => qixGlobal.allowCreateApp().then(() => {
      // all session traffic:
      // we have traffic:received for OnConnected notification before (so second received
      // msg should be ours):
      expect(sentSpy.firstCall.args[0]).to.containSubset(request);
      expect(receivedSpy.secondCall.args[0]).to.containSubset(response);
      expect(starSpy.secondCall.args[0]).to.equal('sent');
      expect(starSpy.secondCall.args[1]).to.containSubset(request);
      expect(starSpy.thirdCall.args[0]).to.equal('received');
      expect(starSpy.thirdCall.args[1]).to.containSubset(response);

      // handle-specific traffic:
      expect(apiSentSpy.firstCall.args[0]).to.containSubset(request);
      expect(apiReceivedSpy.firstCall.args[0]).to.containSubset(response);
      expect(apiStarSpy.firstCall.args[0]).to.equal('sent');
      expect(apiStarSpy.firstCall.args[1]).to.containSubset(request);
      expect(apiStarSpy.secondCall.args[0]).to.equal('received');
      expect(apiStarSpy.secondCall.args[1]).to.containSubset(response);
    }));
  });
});
