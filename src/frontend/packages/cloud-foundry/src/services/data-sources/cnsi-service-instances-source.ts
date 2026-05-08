import { CnsiEntitySource } from './cnsi-entity-source';
import type { StServiceInstance } from '../endpoint-data/stratos-types';
import { legacyToStServiceInstance } from '../endpoint-data/services-legacy-adapters';

// Per-CNSI source for service instances. Reads
// /pp/v1/cf/service_instances/{cnsi}, which the backend handler fully
// drains server-side — both managed and user-provided instances arrive
// in one paged envelope. The CnsiEntitySource base class still walks
// pagination defensively in case CAPI/Jetstream ever surfaces
// per_page-bounded responses; backend always returns a single fully
// drained page today.
//
// The handler still emits the legacy flat shape (services-domain slice
// has not reworked it yet); adaptResource bridges to the new nested-ref
// StServiceInstance until the handler rework lands.
export class CnsiServiceInstancesSource extends CnsiEntitySource<StServiceInstance> {
  protected readonly entityName = 'service_instances';

  protected adaptResource(raw: unknown, cnsiGuid: string): StServiceInstance {
    return legacyToStServiceInstance({ ...(raw as any), cnsiGuid });
  }
}
