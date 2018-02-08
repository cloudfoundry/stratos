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
import { shareReplay, map, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import {
  GetEndpointInfo,
  CFInfoSchema,
  CF_INFO_ENTITY_KEY
} from '../../../store/actions/cloud-foundry.actions';

@Injectable()
export class CloudFoundryEndpointService {
  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<CNSISModel>>;
  cfEndpointEntityService: EntityService<CNSISModel>;
  connected$: Observable<boolean>;
  constructor(
    public cfGuid: string,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.cfEndpointEntityService = this.entityServiceFactory.create(
      EndpointSchema.key,
      EndpointSchema,
      cfGuid,
      new GetAllCNSIS()
    );

    this.cfInfoEntityService = this.entityServiceFactory.create(
      CF_INFO_ENTITY_KEY,
      CFInfoSchema,
      this.cfGuid,
      new GetEndpointInfo(this.cfGuid)
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

    this.info$ = this.cfInfoEntityService.entityObs$.pipe(shareReplay(1));
  }
}
