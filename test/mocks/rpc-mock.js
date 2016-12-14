import RPC from '../../src/services/qix/rpc';

export default class RPCMock extends RPC {
  send(response) {
    return this.Promise.resolve(response);
  }
}
