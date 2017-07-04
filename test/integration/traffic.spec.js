import chai from 'chai';
import chaiSubset from 'chai-subset';
import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/qix';
import Schema from '../../schemas/qix/3.2/schema.json';
import utils from './utils';

chai.use(chaiSubset);

describe('qix-logging', () => {
  let qixGlobal;
  // let isServer = true;
  let config;
  let sandbox;

  before(() =>
    utils.getDefaultConfig().then((cfg) => {
      config = cfg;
      sandbox = sinon.sandbox.create();
      // isServer = defaultConfig.isServer;
      config.Promise = Promise;
      config.schema = Schema;
      config.listeners = {
        'traffic:sent': sinon.spy(),
        'traffic:received': sinon.spy(),
        'traffic:*': sinon.spy(),
      };
      config.createSocket = url =>
        new WebSocket(url, config.socket);

      return Qix.connect(config).then((g) => {
        qixGlobal = g.global;
      });
    })
  );

  after(() => {
    sandbox.restore();
    qixGlobal.session.on('error', () => {}); // Swallow the error
    return qixGlobal.session.close();
  });

  it('should log qix traffic', () => Promise.delay(100).then(() => qixGlobal.allowCreateApp().then(() => {
    const request = {
      method: 'AllowCreateApp',
      handle: -1,
      params: [],
      delta: false,
      id: 1,
    };
    const response = {
      id: 1,
      jsonrpc: '2.0',
      result: {
        qReturn: true,
      },
    };
    // we have traffic:received for OnConnected notification before (so second received
    // msg should be ours):
    expect(config.listeners['traffic:sent'].firstCall.args[0]).to.containSubset(request);
    expect(config.listeners['traffic:received'].secondCall.args[0]).to.containSubset(response);
    expect(config.listeners['traffic:*'].secondCall.args[0]).to.equal('sent');
    expect(config.listeners['traffic:*'].secondCall.args[1]).to.containSubset(request);
    expect(config.listeners['traffic:*'].thirdCall.args[0]).to.equal('received');
    expect(config.listeners['traffic:*'].thirdCall.args[1]).to.containSubset(response);
  })));
});
