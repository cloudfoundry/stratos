import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import { EntityServiceFactory } from '../core/entity-service-factory.service';
import { ENTITY_SERVICE } from '../shared/entity.tokens';
import { AppState } from '../store/app-state';
import { RequestSectionKeys } from '../store/reducers/api-request-reducer/types';
import { IRequestAction } from '../store/types/request.types';

export function generateTestEntityServiceProvider(
  guid: string,
  schema: normalizrSchema.Entity,
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
    provide: ENTITY_SERVICE,
    useFactory,
    deps: [Store, EntityServiceFactory]
  };
}
