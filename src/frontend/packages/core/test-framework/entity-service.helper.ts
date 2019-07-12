import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import { EntityRequestAction } from '../../store/src/types/request.types';
import { CFAppState } from '../../store/src/app-state';
import { EntityServiceFactory } from '../src/core/entity-service-factory.service';
import { RequestSectionKeys } from '../../store/src/reducers/api-request-reducer/types';
import { ENTITY_SERVICE } from '../src/shared/entity.tokens';

export function generateTestEntityServiceProvider(
  guid: string,
  schema: normalizrSchema.Entity,
  action: EntityRequestAction
) {
  function useFactory(
    store: Store<CFAppState>,
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
