import { CnsiEntitySource } from './cnsi-entity-source';
import type { StServiceInstance } from '../endpoint-data/stratos-types';

// Per-CNSI source for service instances. Reads
// /pp/v1/cf/service_instances/{cnsi}, which now emits the nested-ref
// StServiceInstance shape natively at every ?return= tier (no wire
// adapter needed). The CnsiEntitySource base class walks pagination via
// the v3 envelope's pagination links.
export class CnsiServiceInstancesSource extends CnsiEntitySource<StServiceInstance> {
  protected readonly entityName = 'service_instances';

  protected adaptResource(raw: unknown, cnsiGuid: string): StServiceInstance {
    return { ...(raw as StServiceInstance), cnsiGuid };
  }
}
