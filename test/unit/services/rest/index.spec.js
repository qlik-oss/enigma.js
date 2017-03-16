import url from 'url';
import Rest from '../../../../src/services/rest/index';

describe('Rest', () => {
  let rootUrl;
  let svcOptions;
  let restOptions;

  beforeEach(() => {
    rootUrl = 'http://localhost:4848/api/';
    svcOptions = { id: 'test', version: 'v1' };
    restOptions = {
      Promise,
      host: 'localhost',
      port: 60000,
      services: [],
      certs: {},
      secure: false,
    };
  });

  describe('validateRestOptions()', () => {
    it('should not throw on a proper configuration', () => {
      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.not.throw();

      restOptions.services.push({ id: 'test', version: 'v1' });

      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.not.throw();
    });

    it('should throw errors when service id is missing', () => {
      restOptions.services.push({ id: null });
      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.throw();
    });

    it('should throw errors when both service url and version is missing', () => {
      restOptions.services.push({ id: 'test', version: null, url: null });
      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.throw();
    });

    it('should throw errors when service id isn\'t unique', () => {
      restOptions.services.push({ id: 'test', version: 'v1' }, { id: 'test', version: 'v1' });
      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.throw();
    });

    it('should throw errors when Promise is missing (and environment doesn\'t supply one)', () => {
      const originalPromise = global.Promise;
      delete restOptions.Promise;
      delete global.Promise;
      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.throw();
      global.Promise = originalPromise;
    });

    it('should throw errors when host is missing', () => {
      delete restOptions.host;
      expect(() => {
        Rest.validateRestOptions(restOptions);
      }).to.throw();
    });

    it('should convert unsecure parameter to secure if the secure parameter is not set', () => {
      restOptions.unsecure = false;
      restOptions.secure = undefined;
      Rest.validateRestOptions(restOptions)
      expect(restOptions.secure).to.equal(true);
    });
  });

  describe('generateOpenAPIConfig()', () => {
    it('should generate correct defaults', () => {
      const result = Rest.generateOpenAPIConfig(svcOptions, rootUrl);
      expect(result).to.be.an('object');
      expect(result.enableCookies).to.equal(true);
      expect(result.usePromise).to.equal(true);
      expect(result.url).to.equal(`${rootUrl}${svcOptions.id}/${svcOptions.version}/openapi`);
    });
  });

  describe('generateRootUrl()', () => {
    it('should generate a proper root url', () => {
      restOptions.prefix = 'custom';
      const generatedUrl = Rest.generateRootUrl(restOptions);
      const parts = url.parse(generatedUrl);
      expect(parts.protocol).to.equal('http:');
      expect(parts.hostname).to.equal('localhost');
      expect(parts.port).to.equal('60000');
      expect(parts.path).to.equal('/custom/api/');
    });

    it('should use the correct protocol', () => {
      restOptions.secure = true;
      const generatedUrl = Rest.generateRootUrl(restOptions);
      expect(generatedUrl.indexOf('https://') > -1).to.equal(true);
    });
  });

  describe('createHttpClient()', () => {
    beforeEach(() => {
      restOptions.HttpClient = function HttpClient() {};
    });

    it('should instantiate', () => {
      const client = Rest.createHttpClient(svcOptions, restOptions);
      expect(client.constructor.name).to.equal('HttpClient');
    });
  });

  describe('createServiceAPI()', () => {
    function SwaggerMock() {}

    function create(_svcOptions, _restOptions) {
      return Rest.createServiceAPI({
        svc: _svcOptions,
        restOptions: _restOptions,
        rootUrl,
        OpenAPIClient: SwaggerMock,
      });
    }

    it('should return a new swagger instance', () => {
      const result = create(svcOptions, restOptions);
      expect(result instanceof SwaggerMock).to.equal(true);
    });

    it('should create a generic REST service', () => {
      svcOptions.url = '/api/test-svc/swagger.json';
      restOptions.Promise = { resolve: sinon.spy() };
      create(svcOptions, restOptions);
      expect(restOptions.Promise.resolve.called).to.equal(true);
      expect(restOptions.Promise.resolve.args[0][0].test).to.be.an('object');
    });
  });

  describe('connect()', () => {
    it('should connect without any services defined', () => {
      const inst = new Rest().connect(restOptions);
      expect(inst.then).to.be.a('function');
    });
  });
});
