import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { APIResource } from '../../../../../store/src/types/api.types';
import { IService } from '../../../cf-api-svc.types';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceOffering } from '../../../services/endpoint-data/stratos-types';

/**
 * Lists the service offerings reachable from a given (cnsi, space).
 * Wraps `ServiceCatalogDataService.serviceOfferingsInSpace` and presents
 * the result as the legacy `APIResource<IService>[]` shape that
 * `select-service.component` + `app-cf-service-card` consume.
 *
 * The APIResource adapter is local to this service — when the
 * cf-service-card migrates to read `StServiceOffering` directly, the
 * mapping retires and the consumer can read the SignalSource value
 * straight from `serviceOfferingsInSpace`.
 */
@Injectable({
  providedIn: 'root'
})
export class ServicesWallService {
  private serviceCatalog = inject(ServiceCatalogDataService);

  // Returns the active SignalSource directly so callers that need
  // loading/error state (e.g. select-service.component's isFetching
  // gating) can read it without spinning up a separate pagination
  // monitor.
  getServicesInSpaceSource(cfGuid: string, spaceGuid: string): SignalSource<StServiceOffering[]> {
    return this.serviceCatalog.serviceOfferingsInSpace(cfGuid, spaceGuid);
  }
}

/**
 * Maps an `StServiceOffering` (V3 nested-ref shape) onto the legacy
 * `APIResource<IService>` envelope. Limited to fields the wizard's
 * Select Service step reads — guid, label (offering name), description.
 *
 * Retires when `app-cf-service-card` consumes `StServiceOffering`
 * directly.
 */
export function offeringToApiResource(offering: StServiceOffering): APIResource<IService> {
  return {
    metadata: {
      guid: offering.guid,
      url: '',
      created_at: offering.createdAt ?? '',
      updated_at: offering.updatedAt ?? '',
    },
    entity: {
      label: offering.name,
      description: offering.description,
      cfGuid: offering.cnsiGuid,
    } as IService,
  };
}

// Re-export the Observable adapter signature consumers can opt into when
// they still need an Observable surface. Kept thin so callers can opt
// out of the legacy shape gradually.
export type ServicesInSpaceAdapter = (cfGuid: string, spaceGuid: string) => Observable<APIResource<IService>[]>;
