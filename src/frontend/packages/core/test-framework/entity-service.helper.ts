import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import { EntityRequestAction } from '../../store/src/types/request.types';
import { EntityServiceFactory } from '../src/core/entity-service-factory.service';
import { ENTITY_SERVICE } from '../src/shared/entity.tokens';
import { AppState } from '../../store/src/app-state';
import { RequestSectionKeys } from '../../store/src/reducers/api-request-reducer/types';

export function generateTestEntityServiceProvider(
  guid: string,
  schema: normalizrSchema.Entity,
  action: EntityRequestAction
) {
  function useFactory(
    store: Store<AppState>,
    entityServiceFactory: EntityServiceFactory
  ) {
    return entityServiceFactory.create(
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
