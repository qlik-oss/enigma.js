/**
 * @module index
 */
import Registry from './registry';
import Qix from './services/qix/index';
import Rest from './services/rest/index';

const registry = new Registry();
const rest = new Rest();

registry.registerService('qix', (...args) => Qix.connect(...args));
registry.registerService('rest', rest.connect.bind(rest));

export default registry;

/**
 * Default registry instance.
 *
 * Add end point definitions to this object to retrieve sessions or HTTP REST registry API objects.
 * The registry module comes with a pre-defined Qlik Sense Qix Engine definition.
 */
module.exports = registry;
