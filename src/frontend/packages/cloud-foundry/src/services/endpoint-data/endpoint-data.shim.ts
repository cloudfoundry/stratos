import { Injectable, inject } from '@angular/core';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { StEndpointData, StOrg, StSpace } from './stratos-types';

// W-f: the V2 ngrx dispatcher paths for organizations and spaces have been
// retired. Earlier waves removed the readers (cfEntityCatalog.org/space
// paginationStore consumers, ngrx-backed org/space chooser fetches in
// CfOrgSpaceDataService, signal-native cloudfoundry-endpoint.service.orgs$
// reading from EndpointDataService.orgs() instead of pagination state), so
// the WrapperRequestActionSuccess writes this shim used to dispatch under
// `endpoint-{cnsi}` / `spaces-bulk-{cnsi}` pagination keys had become dead
// writes — nothing subscribed to the pagination state they populated, and
// the consumers that select individual entities by guid go through other
// code paths that don't read from the composite-key entries this shim
// produced (FWT-934).
//
// `write()` is kept so EndpointDataService can still report
// loadDetails() completion size samples for the entity-size dashboard.
// The shim file itself is retained as a thin pass-through for its consumer
// surface; consumer-side removal is a separate scope.
@Injectable({ providedIn: 'root' })
export class EndpointDataShim {
  private readonly diagnostics = inject(StratosDiagnostics);

  write(cnsiGuid: string, data: StEndpointData): void {
    for (const org of data.orgs) {
      this.emitSize('organization', cnsiGuid, org);
    }
    for (const space of data.spaces) {
      this.emitSize('space', cnsiGuid, space);
    }
  }

  private emitSize(entityType: string, cnsiGuid: string, payload: StOrg | StSpace): void {
    const bytes = JSON.stringify(payload).length;
    this.diagnostics.emitSample('entity-size-sample', { entityType, cnsiGuid }, bytes);
  }
}
