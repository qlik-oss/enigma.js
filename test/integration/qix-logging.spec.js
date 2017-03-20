import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/services/qix/index';
import Schema from '../../schemas/qix/3.2/schema.json';
import utils from './utils';

describe('qix-logging', () => {
  const qix = new Qix();
  let qixGlobal;
  // let isServer = true;
  const config = {};
  let sandbox;
  before(() =>
    utils.getDefaultConfig().then((defaultConfig) => {
      sandbox = sinon.sandbox.create();
      // isServer = defaultConfig.isServer;
      config.session = defaultConfig.session;
      config.session.route = 'app/engineData';
      config.Promise = Promise;
      config.schema = Schema;
      config.handleLog = sandbox.spy();
      config.createSocket = url =>
      new WebSocket(url, defaultConfig.socket);

      return qix.connect(config).then((g) => {
        qixGlobal = g.global;
      });
    })
  );

  after(() => {
    sandbox.restore();
    qixGlobal.session.on('error', () => {}); // Swallow the error
    return qixGlobal.session.close();
  });

  it('should log qix traffic', () =>
    qixGlobal.allowCreateApp().then(() => {
      expect(config.handleLog.firstCall.args[0]).to.deep.equal({
        msg: 'Request',
        req: {
          method: 'AllowCreateApp',
          handle: -1,
          params: [],
          delta: false,
          outKey: -1,
          id: 1 } });

      expect(config.handleLog.secondCall.args[0]).to.deep.equal({
        msg: 'Response',
        res: {
          id: 1,
          jsonrpc: '2.0',
          result: {
            qReturn: true } },
        meta: {
          method: 'AllowCreateApp',
          handle: -1,
          params: [],
          delta: false,
          outKey: -1,
          id: 1 } });
    })
  );
});
