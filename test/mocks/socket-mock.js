import KeyValueCache from '../../src/cache';
import Events from '../../src/event-emitter';

export default class SocketMock {
  constructor(url, throwError = false) {
    this.url = url;
    this.CLOSE = 0;
    this.OPEN = 1;
    this.readyState = 0;

    if (throwError) {
      throw new Error("Can't connect to endpoint");
    }

    this.interceptors = new KeyValueCache();

    setTimeout(() => SocketMock.emit('created', this));
  }
  open() {
    this.readyState = this.OPEN;
    this.onopen();
  }
  close(code, reason) {
    if (this.readyState === this.CLOSE) {
      return;
    }
    this.readyState = this.CLOSE;
    this.onclose({
      code,
      reason,
    });
  }
  message(msg) {
    this.onmessage(msg);
  }
  error(error) {
    this.onerror(error);
  }
  on() {
  }
  emit() {
  }
  removeAllListeners() {
  }
  onopen() {
  }
  onclose() {
  }
  onerror() {
  }
  onmessage(/* msg */) {
  }
  send(msg) {
    const request = JSON.parse(msg);
    const response = this.interceptors.get(request.method);
    if (response) {
      response.id = request.id;
      const data = JSON.stringify(response);
      setTimeout(() => this.message({ data }));
    }
  }
  intercept(requestMethod) {
    return {
      return: (response) => {
        this.interceptors.add(requestMethod, response);
      },
    };
  }
}

Events.mixin(SocketMock);
