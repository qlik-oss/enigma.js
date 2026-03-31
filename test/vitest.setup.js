import {
  afterAll, afterEach, beforeAll, beforeEach, chai,
} from 'vitest';
import sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';
import sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);

global.chai = chai;
global.sinon = sinon;
global.before = beforeAll;
global.after = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
