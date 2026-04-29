import { Injectable } from '@angular/core';

import { serviceEntityType } from '../../../cf-entity-types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';

@Injectable({
  providedIn: 'root'
})
export class ServicesWallService {

  getSpaceServicePagKey(cfGuid: string, spaceGuid: string) {
    return createEntityRelationPaginationKey(serviceEntityType, `${cfGuid}-${spaceGuid}`);
  }

  getServicesInSpace = (cfGuid: string, spaceGuid: string) => {
    const paginationKey = this.getSpaceServicePagKey(cfGuid, spaceGuid);
    return cfEntityCatalog.service.store.getAllInSpace.getPaginationService(cfGuid, paginationKey, spaceGuid).entities$;
  };
}
