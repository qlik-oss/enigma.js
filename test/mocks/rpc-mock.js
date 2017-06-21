import RPC from '../../src/rpc';

export default class RPCMock extends RPC {
  send(response) {
    return this.Promise.resolve(response);
  }
}
