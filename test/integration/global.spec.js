import Promise from 'bluebird';
import Qix from '../../src/qix';
import utils from './utils';

describe('QIX Global', () => {
  let qixGlobal;

  before(() => {
    const config = utils.getDefaultConfig();
    config.mixins = [{
      types: 'Global',
      extend: {
        tweet() {
          return Promise.resolve('Mr tweeter!');
        },
      },
    }];
    return Qix.create(config).open().then((global) => {
      qixGlobal = global;
    });
  });

  after(() => qixGlobal.session.close());

  it('should call custom tweet', () =>
    expect(qixGlobal.tweet()).to.eventually.equal('Mr tweeter!'),
  );

  it('should AbortAll', () =>
    expect(qixGlobal.abortAll()).to.eventually.deep.equal({}),
  );

  it('should AbortRequest', () =>
    expect(qixGlobal.abortRequest(0)).to.eventually.deep.equal({}),
  );

  it('should AllowCreateApp', () =>
    expect(qixGlobal.allowCreateApp()).to.eventually.equal(true),
  );

  it('should CancelReload', () =>
    expect(qixGlobal.cancelReload()).to.eventually.deep.equal({}),
  );

  it('should CancelRequest', () =>
    expect(qixGlobal.cancelRequest(0)).to.eventually.deep.equal({}),
  );

  it('should ConfigureReload', () =>
    expect(qixGlobal.configureReload(false, false, false)).to.eventually.deep.equal({}),
  );

  it('should CreateSessionApp', () =>
    expect(qixGlobal.createSessionApp()).to.eventually.be.an('object'),
  );

  it('should GetBNF', () =>
    expect(qixGlobal.getBNF(0)).to.eventually.be.an('array'),
  );

  it('should GetCustomConnectors', () =>
    expect(qixGlobal.getCustomConnectors()).to.eventually.be.an('array'),
  );

  it('should GetDefaultAppFolder', () =>
    expect(qixGlobal.getDefaultAppFolder()).to.eventually.be.a('string'),
  );

  it('should GetDocList', () =>
    expect(qixGlobal.getDocList()).to.eventually.be.an('array'),
  );

  it('should GetSupportedCodePages', () =>
    expect(qixGlobal.getSupportedCodePages()).to.eventually.be.an('array'),
  );

  it('should GetUniqueID', () =>
    expect(qixGlobal.getUniqueID()).to.eventually.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    ),
  );

  it('should validate IsDesktopMode', () =>
    expect(qixGlobal.isDesktopMode()).to.eventually.be.a('boolean'),
  );

  it('should validate IsPersonalMode', () =>
    expect(qixGlobal.isPersonalMode()).to.eventually.be.a('boolean'),
  );

  it('should get OSName', () =>
    expect(qixGlobal.oSName()).to.eventually.be.a('string'),
  );

  it('should get OSVersion', () =>
    expect(qixGlobal.oSVersion()).to.eventually.be.a('string'),
  );

  it('should get ProductVersion', () =>
    expect(qixGlobal.productVersion()).to.eventually.be.a('string'),
  );

  it('should get QTProduct', () =>
    expect(qixGlobal.qTProduct()).to.eventually.be.a('string'),
  );

  it('should get QvVersion', () =>
    expect(qixGlobal.qvVersion()).to.eventually.be.a('string'),
  );

  it('should ReloadExtensionList', () =>
    expect(qixGlobal.reloadExtensionList()).to.eventually.be.an('object'),
  );
});
