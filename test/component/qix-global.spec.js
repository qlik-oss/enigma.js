import Promise from 'bluebird';
import Schema from '../../schemas/qix/3.1/schema.json';
import Qix from '../../src/services/qix/index';
import SocketMock from '../mocks/socket-mock';

describe('QIX Global', () => {
  let sandbox;
  let qix;
  let qixGlobal;
  let config;
  let socket;

  beforeEach(() => {
    SocketMock.on('created', (s) => {
      socket = s;
      socket.open();
    });
    qix = new Qix();
    config = {};
    sandbox = sinon.sandbox.create();

    config.Promise = Promise;
    config.schema = Schema;
    config.session = {
      route: 'app/engineData',
      host: 'mocked',
      port: 1337,
    };
    config.createSocket = url =>
    new SocketMock(url)
    ;

    config.mixins = [{
      types: 'Global',
      extend: {
        tweet() {
          return Promise.resolve('Mr tweeter!');
        },
      },
    }];

    return qix.connect(config).then((q) => {
      qixGlobal = q.global;
    });
  });

  afterEach(() => {
    SocketMock.removeAllListeners();
    qixGlobal.session.on('error', () => {}); // Swallow the error
    return qixGlobal.session.close().then(() => {
      sandbox.restore();
    });
  });

  it('should call custom tweet', () =>
    expect(qixGlobal.tweet()).to.eventually.equal('Mr tweeter!')
  );

  it('should AbortAll', () => {
    socket.intercept('AbortAll').return({ result: {} });
    return expect(qixGlobal.abortAll()).to.eventually.deep.equal({});
  });

  it('should AbortRequest', () => {
    socket.intercept('AbortRequest').return({ result: {} });
    return expect(qixGlobal.abortRequest(0)).to.eventually.deep.equal({});
  });

  describe('AllowCreateApp', () => {
    it('should return truthy', () => {
      socket.intercept('AllowCreateApp').return({ result: { qReturn: true } });
      return expect(qixGlobal.allowCreateApp()).to.eventually.equal(true);
    });

    it('should return false', () => {
      socket.intercept('AllowCreateApp').return({ result: { qReturn: false } });
      return expect(qixGlobal.allowCreateApp()).to.eventually.equal(false);
    });
  });

  it('should CancelReload', () => {
    socket.intercept('CancelReload').return({ result: {} });
    return expect(qixGlobal.cancelReload()).to.eventually.deep.equal({});
  });

  it('should CancelRequest', () => {
    socket.intercept('CancelRequest').return({ result: {} });
    return expect(qixGlobal.cancelRequest(0)).to.eventually.deep.equal({});
  });

  it('should ConfigureReload', () => {
    socket.intercept('ConfigureReload').return({ result: {} });
    return expect(qixGlobal.configureReload(false, false, false)).to.eventually.deep.equal({});
  });

  it('should CreateSessionApp', () => {
    socket.intercept('CreateSessionApp').return({ result: { qReturn: { qType: 'Doc', qHandle: 1 } }, change: [1] });
    return expect(qixGlobal.createSessionApp()).to.eventually.be.an('object');
  });

  describe('GetAuthenticatedUser', () => {
    it('should return string that contains `UserDirectory=` `UserId=` for server', () => {
      socket.intercept('GetAuthenticatedUser').return({ result: { qReturn: 'UserDirectory=FOO;UserId=BAR' } });
      return expect(qixGlobal.getAuthenticatedUser()).to.eventually
      .contain('UserDirectory=').and
      .contain('UserId=');
    });

    it('should return string that contains `Personal` for desktop', () => {
      socket.intercept('GetAuthenticatedUser').return({ result: { qReturn: 'Personal' } });
      return expect(qixGlobal.getAuthenticatedUser()).to.eventually
      .contain('Personal');
    });
  });

  it('should GetBNF', () => {
    socket.intercept('GetBNF').return({ result: { qReturn: [] } });
    return expect(qixGlobal.getBNF(0)).to.eventually.be.an('array');
  });

  describe('GetConfiguration', () => {
    it('should return configuration for server', () => {
      socket.intercept('GetConfiguration').return({ result: { qReturn: { qFeatures: { qAutoSave: true, qPublishing: true, qSSOEnabled: true } } } });
      return expect(qixGlobal.getConfiguration()).to.eventually.deep.equal({
        qFeatures: {
          qAutoSave: true,
          qPublishing: true,
          qSSOEnabled: true,
        },
      });
    });

    it('should return configuration for desktop', () => {
      socket.intercept('GetConfiguration').return({ result: { qReturn: { qFeatures: { qIsDesktop: true } } } });
      return expect(qixGlobal.getConfiguration()).to.eventually.deep.equal({
        qFeatures: {
          qIsDesktop: true,
        },
      });
    });
  });

  it('should GetCustomConnectors', () => {
    socket.intercept('GetCustomConnectors').return({ result: { qReturn: [] } });
    return expect(qixGlobal.getCustomConnectors()).to.eventually.be.an('array');
  });

  it('should GetDefaultAppFolder', () => {
    socket.intercept('GetDefaultAppFolder').return({ result: { qReturn: '' } });
    return expect(qixGlobal.getDefaultAppFolder()).to.eventually.be.a('string');
  });

  it('should GetDocList', () => {
    socket.intercept('GetDocList').return({ result: { qReturn: [] } });
    return expect(qixGlobal.getDocList()).to.eventually.be.an('array');
  });

  it('should GetOdbcDsns', () => {
    socket.intercept('GetOdbcDsns').return({ result: { qReturn: [] } });
    return expect(qixGlobal.getOdbcDsns()).to.eventually.be.an('array');
  });

  it('should GetOleDbProviders', () => {
    socket.intercept('GetOleDbProviders').return({ result: { qReturn: [] } });
    return expect(qixGlobal.getOleDbProviders()).to.eventually.be.an('array');
  });

  it('should GetSupportedCodePages', () => {
    socket.intercept('GetSupportedCodePages').return({ result: { qReturn: [] } });
    return expect(qixGlobal.getSupportedCodePages()).to.eventually.be.an('array');
  });

  it('should GetUniqueID', () => {
    socket.intercept('GetUniqueID').return({ result: { qReturn: '12345678-1234-1234-1234-123456789abc' } });
    return expect(qixGlobal.getUniqueID()).to.eventually.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    );
  });

  it('should validate IsDesktopMode', () => {
    socket.intercept('IsDesktopMode').return({ result: { qReturn: true } });
    return expect(qixGlobal.isDesktopMode()).to.eventually.be.a('boolean');
  });

  it('should validate IsPersonalMode', () => {
    socket.intercept('IsPersonalMode').return({ result: { qReturn: true } });
    return expect(qixGlobal.isPersonalMode()).to.eventually.be.a('boolean');
  });

  it('should get OSName', () => {
    socket.intercept('OSName').return({ result: { qReturn: 'windows' } });
    return expect(qixGlobal.oSName()).to.eventually.be.a('string');
  });

  it('should get OSVersion', () => {
    socket.intercept('OSVersion').return({ result: { qReturn: 'version' } });
    return expect(qixGlobal.oSVersion()).to.eventually.be.a('string');
  });

  it('should get ProductVersion', () => {
    socket.intercept('ProductVersion').return({ result: { qReturn: 'version' } });
    return expect(qixGlobal.productVersion()).to.eventually.be.a('string');
  });

  it('should get QTProduct', () => {
    socket.intercept('QTProduct').return({ result: { qReturn: 'version' } });
    return expect(qixGlobal.qTProduct()).to.eventually.be.a('string');
  });

  it('should get QvVersion', () => {
    socket.intercept('QvVersion').return({ result: { qReturn: 'version' } });
    return expect(qixGlobal.qvVersion()).to.eventually.be.a('string');
  });

  it('should ReloadExtensionList', () => {
    socket.intercept('ReloadExtensionList').return({ result: { qReturn: {} } });
    return expect(qixGlobal.reloadExtensionList()).to.eventually.be.an('object');
  });
});
