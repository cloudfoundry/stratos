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
import { shareReplay, map } from 'rxjs/operators';

@Injectable()
export class CloudFoundryEndpointService {
  endpoint$: Observable<EntityInfo<CNSISModel>>;
  cfEndpointEntityService: EntityService<CNSISModel>;
  connected$: Observable<boolean>;
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
    this.endpoint$ = this.cfEndpointEntityService.entityObs$.pipe(
      shareReplay(1)
    );

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );
  }
}
