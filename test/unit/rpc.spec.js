import RPC from "../../src/rpc";
import SocketMock from "../mocks/socket-mock";

describe("RPC", () => {
  let rpc;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    rpc = new RPC({
      Promise,
      url: "http://localhost:4848",
      createSocket: (url) => new SocketMock(url, false),
    });
  });

  afterEach(() => {
    SocketMock.removeAllListeners();
    sandbox.restore();
  });

  it("should be a function", () => {
    expect(RPC).to.be.a("function");
    expect(RPC).to.throw();
  });

  it("should set instance variables", () => {
    expect(rpc.resolvers).to.be.an("object");
    expect(rpc.requestId).to.equal(0);
  });

  it("should return a promise when open is called", () => {
    const open = rpc.open();
    expect(open).to.be.an.instanceOf(Promise);
  });

  it("should return the same promise when open is called twice without force", () => {
    const open = rpc.open();
    const openAgain = rpc.open();
    expect(open).to.equal(openAgain);
  });

  it("should return different promises when open is called twice with force", () => {
    const open = rpc.open();
    const openAgain = rpc.open(true);
    expect(open).to.not.equal(openAgain);
  });

  it("should call createSocket when open is called", () => {
    const createSocket = sandbox.spy(rpc, "createSocket");
    rpc.url = "foo";
    rpc.open();
    expect(createSocket).to.have.been.calledWithExactly(rpc.url);
  });

  it("should reject when trying to send a message if the socket isn't open", async () => {
    try {
      await rpc.send();
      throw new Error("Expected send() to reject when socket is not open");
    } catch (err) {
      expect(err.code).to.equal(-1);
      expect(err.message).to.equal("Not connected");
    }
  });

  it("should resolve the open promise when connection is established", async () => {
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;
  });

  it("should reject open promise if no connection is established", async () => {
    const openPromise = rpc.open();
    rpc.socket.error({ message: "error" });
    await expect(openPromise).to.be.rejected;
  });

  it("should emit error", async () => {
    const errorPromise = new Promise((resolve) => {
      rpc.once("socket-error", resolve);
    });
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;
    rpc.socket.error("error");
    const error = await errorPromise;
    expect(error).to.equal("error");
  });

  it("should resolve the close promise when connection is lost", async () => {
    const spy = sinon.spy(rpc, "onClose");
    const openPromise = rpc.open();
    rpc.socket.open();
    const getClosePromise = await openPromise;
    const closePromise = getClosePromise();
    rpc.close();
    await closePromise;
    expect(spy.calledOnce).to.equal(true);
  });

  it("should resolve the close promise when connection is lost with specified code and reason", async () => {
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;
    const result = await rpc.close(1000, "SHUTDOWN");
    expect(result.code).to.equal(1000);
    expect(result.reason).to.equal("SHUTDOWN");
  });

  it("should resolve send promise when message arrives", async () => {
    const request = { msg: "hej" };
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;

    const responsePromise = rpc.send(request);
    rpc.socket.message({ data: JSON.stringify(request) });
    const response = await responsePromise;

    expect(response.msg).to.equal(request.msg);
  });

  it("should emit listeners", async () => {
    const emit = sinon.spy(rpc, "emit");
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;

    rpc.socket.message({
      data: JSON.stringify({
        params: {
          user: "cam",
        },
      }),
    });
    expect(emit).to.have.been.calledWith("notification", {
      params: { user: "cam" },
    });
  });

  it("should emit message", async () => {
    const emit = sinon.spy(rpc, "emit");
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;

    rpc.socket.message({
      data: JSON.stringify({
        foo: "bar",
      }),
    });
    rpc.socket.close();
    expect(emit).to.have.been.calledWith("message", { foo: "bar" });
    expect(emit).to.have.been.calledWith("closed");
  });

  it("should register request and unregister when message arrives", async () => {
    const request = { msg: "hej" };
    const openPromise = rpc.open();
    rpc.socket.open();
    await openPromise;

    const responsePromise = rpc.send(request);
    expect(rpc.resolvers["1"]).to.be.an("object");
    rpc.socket.message({ data: JSON.stringify(request) });
    await responsePromise;
    expect(rpc.resolvers["1"]).to.be.an("undefined");
  });

  it("should reject all outstanding resolvers on error", () => {
    const rejectWith = sandbox.spy();
    rpc.resolvers = {
      1: {
        rejectWith,
      },
      2: {
        rejectWith,
      },
    };
    rpc.onError({ dummy: 123 });

    expect(rejectWith.callCount).to.equal(2);

    const errArg = rejectWith.firstCall.args[0];

    expect(errArg).to.be.instanceOf(Error);
    expect(errArg.code).to.be.equal(-1);
    expect(errArg.message).to.be.equal("Socket error");
  });
});
