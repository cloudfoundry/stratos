import { Injectable } from '@angular/core';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  EndpointSchema,
  GetAllCNSIS
} from '../../../store/actions/cnsis.actions';
import { EntityService } from '../../../core/entity-service';
import { CNSISModel } from '../../../store/types/cnsis.types';
import { Observable } from 'rxjs/Observable';
import { EntityInfo } from '../../../store/types/api.types';

@Injectable()
export class CloudFoundryEndpointService {
  endpoint$: Observable<EntityInfo<CNSISModel>>;
  cfEndpointEntityService: EntityService<CNSISModel>;
  constructor(
    public cfGuid: string,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.cfEndpointEntityService = this.entityServiceFactory.create(
      EndpointSchema.key,
      EndpointSchema,
      cfGuid,
      new GetAllCNSIS()
    );

    this.constructCoreObservables();
  }

  constructCoreObservables() {
    this.endpoint$ = this.cfEndpointEntityService.entityObs$.shareReplay(1);
  }
}
