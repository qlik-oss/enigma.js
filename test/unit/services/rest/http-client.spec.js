/* eslint no-new:0*/
import HttpClient, { generateXrfKey, responseHandler, createRequestSettings } from '../../../../src/services/rest/http-client';

describe('HttpClient (swagger.js compatible)', () => {
  describe('Instantiating', () => {
    it('should throw an error if required parameters is missing', () => {
      expect(() => {
        new HttpClient();
      }).to.throw();

      expect(() => {
        new HttpClient({});
      }).to.throw();

      new HttpClient({}, {});
    });

    it('should expose an `execute` function', () => {
      const inst = new HttpClient({}, { Promise });
      expect(typeof inst.execute).to.equal('function');
    });
  });

  describe('#execute()', () => {
    let opts;
    let inst;
    let reqSpy;

    function createReq(err, response, body) {
      return (_opts, cb) => {
        reqSpy(_opts);
        cb(err, response, body);
      };
    }

    beforeEach(() => {
      reqSpy = sinon.spy();
      opts = {
        method: 'GET',
        url: 'https://localhost/api/test/v1/openapi',
        body: null,
        on: {
          error: sinon.spy(),
          response: sinon.spy(),
        },
      };
      inst = new HttpClient({}, { Promise });
    });

    it('should trigger error event', () => {
      const err = new Error('Failure');
      opts.req = createReq(err);
      inst.execute(opts);
      expect(opts.on.error.callCount).to.equal(1);
      expect(opts.on.error.calledWith(err)).to.equal(true);
    });

    it('should trigger response event', () => {
      opts.req = createReq(null, 'Hello');
      inst.execute(opts);
      expect(opts.on.response.callCount).to.equal(1);
      expect(opts.on.response.args[0][0]).to.deep.equal({ response: 'Hello', body: undefined });
    });

    it('should cachebust', () => {
      inst = new HttpClient({ cachebust: true }, { Promise });

      opts.req = createReq(null, 'Hello');
      inst.execute(opts);

      expect(reqSpy.args[0][0].url.indexOf('?cachebust=') > -1).to.equal(true);

      opts.url += '?test=123';
      inst.execute(opts);
      expect(reqSpy.args[1][0].url.indexOf('&cachebust=') > -1).to.equal(true);
    });
  });

  describe('Request', () => {
    let restOpts;
    let opts;
    let client;

    beforeEach(() => {
      restOpts = {
        httpModule: { request: null },
        headers: { Cookie: 'X-Qlik-Session=123ABC;' },
        certs: {},
      };
      opts = {
        on: { error: sinon.spy(), response: sinon.spy() },
        url: 'http://localhost:4848/api/test/v1/openapi',
      };
      client = new HttpClient({ url: 'http://localhost:4848/api/' }, restOpts);
    });

    function createRequest(verifier) {
      return (...args) => {
        if (verifier) {
          setTimeout(() => verifier(...args));
        }
        return {
          on: sinon.spy(),
          write: sinon.spy(),
          end: sinon.spy(),
        };
      };
    }

    it('should make a request', () => {
      const reqInst = createRequest();
      client.restOpts.httpModule.request = reqInst;
      client.request(opts);
    });

    it('should generate proper settings', () => {
      const settings = createRequestSettings(restOpts, opts);
      expect(settings).to.be.an('object');
      expect(settings.path).to.equal('/api/test/v1/openapi');
    });

    it('should handle query params', () => {
      opts.url += '?test=123';
      const settings = createRequestSettings(restOpts, opts);
      expect(settings.path).to.equal('/api/test/v1/openapi?test=123');
    });

    it('should make a POST request with a body', () => {
      const reqInst = createRequest((reqOpts) => {
        expect(reqOpts.method).to.be.equal('POST');
        expect(reqInst.write.callCount).to.equal(1);
      });
      client.restOpts.httpModule.request = reqInst;
      opts.method = 'POST';
      opts.body = 'Hello';
      client.request(opts);
    });

    it('should make a request using certificates', () => {
      const reqInst = createRequest((reqOpts) => {
        expect(reqOpts.ca).to.be.an('array');
        expect(reqOpts.rejectUnauthorized).to.equal(true);
      });
      client.restOpts.httpModule.request = reqInst;
      client.request(opts);
    });

    it('should add headers correctly', () => {
      const reqInst = createRequest((reqOpts) => {
        expect(reqOpts.headers['X-Qlik-Xrfkey']).to.be.a('string');
        expect(reqOpts.headers.Cookie).to.equal('X-Qlik-Session=123ABC;');
      });
      client.restOpts.httpModule.request = reqInst;
      client.request(opts);
    });

    it('should handle successful responses', () => {
      const res = { statusCode: 200, setEncoding: sinon.spy(), on: sinon.spy() };
      responseHandler(opts, res);
      const dataCallback = res.on.args[0][1];
      dataCallback('Hello');
      const resCallback = res.on.args[1][1];
      expect(opts.on.response.callCount).to.equal(0);
      resCallback();
      expect(opts.on.response.callCount).to.equal(1);
      expect(opts.on.response.args[0][0].data).to.equal('Hello');
    });

    describe('generateXrfKey', () => {
      const TEST_ITERATIONS = 1000;

      const keys = [];

      for (let i = 0; i < TEST_ITERATIONS; i += 1) {
        const key = generateXrfKey();
        keys.push(key);
      }

      it('should always return 16 characters', () => {
        keys.forEach(key => expect(key.length).to.equal(16));
      });
    });
  });
});
