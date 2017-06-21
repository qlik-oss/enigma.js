/**
 * @module index
 */
import Registry from './registry';
import Qix from './qix';

const registry = new Registry();
const qix = new Qix();

registry.registerService('qix', qix.connect.bind(qix));

export default registry;
