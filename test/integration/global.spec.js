import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/qix';
import Schema from '../../schemas/qix/3.2/schema.json';
import utils from './utils';

describe('QIX Global', () => {
  let qixGlobal;
  // let isServer = true;
  let config;

  before(() =>
    utils.getDefaultConfig().then((cfg) => {
      config = cfg;
      config.Promise = Promise;
      config.schema = Schema;
      config.mixins = [{
        types: 'Global',
        extend: {
          tweet() {
            return Promise.resolve('Mr tweeter!');
          },
        },
      }];
      config.createSocket = url =>
        new WebSocket(url, config.socket);

      return Qix.connect(config).then((g) => {
        qixGlobal = g.global;
      });
    })
  );

  after(() => {
    qixGlobal.session.on('error', () => {}); // Swallow the error
    return qixGlobal.session.close();
  });

  it('should call custom tweet', () =>
    expect(qixGlobal.tweet()).to.eventually.equal('Mr tweeter!')
  );

  it('should AbortAll', () =>
    expect(qixGlobal.abortAll()).to.eventually.deep.equal({})
  );

  it('should AbortRequest', () =>
    expect(qixGlobal.abortRequest(0)).to.eventually.deep.equal({})
  );

  it('should AllowCreateApp', () =>
    expect(qixGlobal.allowCreateApp()).to.eventually.equal(true)
  );

  it('should CancelReload', () =>
    expect(qixGlobal.cancelReload()).to.eventually.deep.equal({})
  );

  it('should CancelRequest', () =>
    expect(qixGlobal.cancelRequest(0)).to.eventually.deep.equal({})
  );

  it('should ConfigureReload', () =>
    expect(qixGlobal.configureReload(false, false, false)).to.eventually.deep.equal({})
  );

  it('should CreateSessionApp', () =>
    expect(qixGlobal.createSessionApp()).to.eventually.be.an('object')
  );

  /* it( "should GetAuthenticatedUser", () => {
  if( isServer ) {
  return expect( qixGlobal.getAuthenticatedUser() ).to.eventually
  .contain( "UserDirectory=").and
  .contain( "UserId=");
  } else {
  return expect( qixGlobal.getAuthenticatedUser() ).to.eventually.contain( "Personal" );
  }
  } );*/

  it('should GetBNF', () =>
    expect(qixGlobal.getBNF(0)).to.eventually.be.an('array')
  );

  /* it( "should GetConfiguration", () => {
  return qixGlobal.getConfiguration().then( result => {
  if ( isServer ) {
  expect( result ).to.have.a.property( "qFeatures" ).that.deep.equals( {
  qAutoSave: true,
  qPublishing: true,
  qSSOEnabled: true
  } );
  } else {
  expect( result ).to.have.a.property( "qFeatures" ).that.deep.equals( {
  qIsDesktop: true
  } );
  }
  } );
  } );*/

  it('should GetCustomConnectors', () =>
    expect(qixGlobal.getCustomConnectors()).to.eventually.be.an('array')
  );

  it('should GetDefaultAppFolder', () =>
    expect(qixGlobal.getDefaultAppFolder()).to.eventually.be.a('string')
  );

  it('should GetDocList', () =>
    expect(qixGlobal.getDocList()).to.eventually.be.an('array')
  );

  /* it( "should GetOdbcDsns", () => {
  return expect( qixGlobal.getOdbcDsns() ).to.eventually.be.an( "array");
  } );

  it( "should GetOleDbProviders", () => {
  return expect(qixGlobal.getOleDbProviders() ).to.eventually.be.an( "array" );
  } );*/

  it('should GetSupportedCodePages', () =>
    expect(qixGlobal.getSupportedCodePages()).to.eventually.be.an('array')
  );

  it('should GetUniqueID', () =>
    expect(qixGlobal.getUniqueID()).to.eventually.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    )
  );

  it('should validate IsDesktopMode', () =>
    expect(qixGlobal.isDesktopMode()).to.eventually.be.a('boolean')
  );

  it('should validate IsPersonalMode', () =>
    expect(qixGlobal.isPersonalMode()).to.eventually.be.a('boolean')
  );

  it('should get OSName', () =>
    expect(qixGlobal.oSName()).to.eventually.be.a('string')
  );

  it('should get OSVersion', () =>
    expect(qixGlobal.oSVersion()).to.eventually.be.a('string')
  );

  it('should get ProductVersion', () =>
    expect(qixGlobal.productVersion()).to.eventually.be.a('string')
  );

  it('should get QTProduct', () =>
    expect(qixGlobal.qTProduct()).to.eventually.be.a('string')
  );

  it('should get QvVersion', () =>
    expect(qixGlobal.qvVersion()).to.eventually.be.a('string')
  );

  it('should ReloadExtensionList', () =>
    expect(qixGlobal.reloadExtensionList()).to.eventually.be.an('object')
  );
});
