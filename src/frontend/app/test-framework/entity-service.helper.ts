import { IRequestAction } from '../store/types/request.types';
import { Action, Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { EntityService } from '../core/entity-service';
import { schema } from 'normalizr';
import { RequestSectionKeys } from '../store/reducers/api-request-reducer/types';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { EntityServiceFactory } from '../core/entity-service-factory.service';

export function generateTestEntityServiceProvider(
  guid: string,
  schema: schema.Entity,
  action: IRequestAction
) {
  function useFactory(
    store: Store<AppState>,
    entityServiceFactory: EntityServiceFactory
  ) {
    return entityServiceFactory.create(
      schema.key,
      schema,
      guid,
      action,
      false,
      RequestSectionKeys.CF
    );
  }

  return {
    provide: EntityService,
    useFactory,
    deps: [Store, EntityServiceFactory]
  };
}
