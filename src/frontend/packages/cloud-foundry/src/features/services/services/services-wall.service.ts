import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import { serviceEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { endpointEntityType } from '../../../../../store/src/helpers/stratos-entity-factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IService } from '../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';

@Injectable()
export class ServicesWallService {
  services$: Observable<APIResource<IService>[]>;

  constructor() {
    this.services$ = this.initServicesObservable();
  }

  initServicesObservable = () => {
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType);
    return cfEntityCatalog.service.store.getPaginationService(null, paginationKey, {}).entities$
  }

  getServicesInCf = (cfGuid: string) => this.services$.pipe(
    filter(p => !!p && p.length > 0),
    map(services => services.filter(s => s.entity.cfGuid === cfGuid)),
    filter(p => !!p),
    publishReplay(1),
    refCount()
  )

  getSpaceServicePagKey(cfGuid: string, spaceGuid: string) {
    return createEntityRelationPaginationKey(serviceEntityType, `${cfGuid}-${spaceGuid}`);
  }

  getServicesInSpace = (cfGuid: string, spaceGuid: string) => {
    const paginationKey = this.getSpaceServicePagKey(cfGuid, spaceGuid);
    return cfEntityCatalog.service.store.getAllInSpace.getPaginationService(cfGuid, paginationKey, spaceGuid).entities$;
  }
}
