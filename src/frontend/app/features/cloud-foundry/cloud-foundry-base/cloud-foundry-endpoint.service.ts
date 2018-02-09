import { Injectable } from '@angular/core';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  EndpointSchema,
  GetAllEndpoints
} from '../../../store/actions/endpoint.actions';
import { EntityService } from '../../../core/entity-service';
import { EndpointModel } from '../../../store/types/endpoint.types';
import { Observable } from 'rxjs/Observable';
import { EntityInfo } from '../../../store/types/api.types';
import { shareReplay, map, tap, filter } from 'rxjs/operators';
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
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  cfEndpointEntityService: EntityService<EndpointModel>;
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
      new GetAllEndpoints()
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
    this.endpoint$ = this.cfEndpointEntityService.waitForEntity$;

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.info$ = this.cfInfoEntityService.waitForEntity$.pipe(shareReplay(1));
  }
}
