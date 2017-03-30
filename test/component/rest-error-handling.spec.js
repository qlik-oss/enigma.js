/* eslint-disable arrow-body-style */
import nock from 'nock';
import chaiSubset from 'chai-subset';
import Enigma from '../../src/index';

chai.use(chaiSubset);

describe('Error handling in the rest api', () => {
  let sandbox;
  let testConfig;
  before(() => {
    nock('http://localhost:4848')
      .persist()
      .get('/api/about/v1/openapi')
      .reply(200, 'Persisting all the way');

    sandbox = sinon.sandbox.create();

    testConfig = { secure: false,
      host: 'localhost',
      port: 4747,
      services: [{ id: 'test', version: 'v1' }],
    };
  });

  after(() => {
    sandbox.restore();
  });

  describe('Failing to connecting to a service in three ways', () => {
    let scope;
    beforeEach(() => {
      scope = nock('http://localhost:4747');
    });

    it('should fail with a nice text for a bad textual response', () => {
      scope.get('/api/test/v1/openapi').reply(200, 'bad text');
      const servicePromise = Enigma.getService('rest', testConfig);
      return expect(servicePromise).to.eventually.be.rejectedWith('failed to parse JSON/YAML response');
    });

    it('should fail with a nice text for a 404', () => {
      scope.get('/api/test/v1/openapi').reply(404, 'Not found');
      const servicePromise = Enigma.getService('rest', testConfig);
      return expect(servicePromise).to.eventually.be.rejectedWith('Can\'t read swagger JSON from http://localhost:4747/api/test/v1/openapi');
    });

    it('should fail with a nice text for connectionrefused', () => {
      scope.get('/api/test/v1/openapi')
        .replyWithError({
          code: 'ECONNREFUSED',
          errno: 'ECONNREFUSED',
          syscall: 'connect',
          address: '127.0.0.1',
          port: 4747,
        });
      const servicePromise = Enigma.getService('rest', testConfig);
      return expect(servicePromise).to.eventually.be.rejectedWith('ECONNREFUSED :  http://localhost:4747/api/test/v1/openapi');
    });
  });

  describe('Succesfully connecting to a service but fail in calling it', () => {
    let scope;
    let testService;
    beforeEach(() => {
      scope = nock('http://localhost:4747');
      scope.get('/api/test/v1/openapi').reply(200, JSON.stringify({
        swagger: '2.0',
        basePath: '/api/test/v1',
        paths: {
          '/test': {
            get: {
              responses: {
                200: {
                  description: 'OK',
                },
              },
            },
          },
        },
      }));

      return Enigma.getService('rest', testConfig).then((services) => {
        testService = services.test;
      });
    });

    it('should return the expected response from the test call', () => {
      scope.get('/api/test/v1/test').reply(200, '{"answer":"tested indeed"}');
      const returnedJsonObject = testService.apis.default.get_test().then(response => response.obj);
      return expect(returnedJsonObject).to.eventually.deep.equal({ answer: 'tested indeed' });
    });

    it('should be rejected for a 404', () => {
      scope.get('/api/test/v1/test').reply(404, 'Not found');
      const error = testService.apis.default.get_test();
      return expect(error).to.be.rejected.and.eventually.have.property('status', 404);
    });

    it('should be rejected for a ECONNREFUSED', () => {
      scope.get('/api/test/v1/test').replyWithError({
        code: 'ECONNREFUSED',
        errno: 'ECONNREFUSED',
        syscall: 'connect',
        address: '127.0.0.1',
        port: 4747,
      });
      const error = testService.apis.default.get_test();
      return expect(error).to.be.rejected.and.eventually.have.property('status', 'ECONNREFUSED');
    });
  });
});
