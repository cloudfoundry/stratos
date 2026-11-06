import { HttpClient } from '@angular/common/http';
import { CnsiEntitySource } from './cnsi-entity-source';
import type { StServiceInstance } from '../endpoint-data/stratos-types';

// Per-CNSI source for service instances. Reads
// /pp/v1/cf/service_instances/{cnsi}, which now emits the nested-ref
// StServiceInstance shape natively at every ?return= tier (no wire
// adapter needed). The CnsiEntitySource base class walks pagination via
// the v3 envelope's pagination links.
//
// Read-only: service-instance create/update route through
// ServiceCatalogDataService and delete through EntityDeleteController
// (see CfServiceInstancesSignalConfigService.deleteServiceInstance).
export class CnsiServiceInstancesSource extends CnsiEntitySource<StServiceInstance> {
  protected readonly entityName = 'service_instances';

  constructor(
    cnsiGuid: string,
    http: HttpClient,
    pageSize: number = 100,
  ) {
    super(cnsiGuid, http, pageSize);
  }

  protected adaptResource(raw: unknown, cnsiGuid: string): StServiceInstance {
    return { ...(raw as StServiceInstance), cnsiGuid };
  }
}
