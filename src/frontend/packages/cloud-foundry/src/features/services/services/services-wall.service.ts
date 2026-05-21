import { Injectable, inject } from '@angular/core';

import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceOffering } from '../../../services/endpoint-data/stratos-types';

/**
 * Lists the service offerings reachable from a given (cnsi, space). Thin
 * pass-through over `ServiceCatalogDataService.serviceOfferingsInSpace`,
 * kept as its own service so consumers can be provider-injected with a
 * mockable seam in tests.
 */
@Injectable({
  providedIn: 'root'
})
export class ServicesWallService {
  private serviceCatalog = inject(ServiceCatalogDataService);

  getServicesInSpaceSource(cfGuid: string, spaceGuid: string): SignalSource<StServiceOffering[]> {
    return this.serviceCatalog.serviceOfferingsInSpace(cfGuid, spaceGuid);
  }
}
