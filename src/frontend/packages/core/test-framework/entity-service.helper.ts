import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import { IRequestAction } from '../../store/src/types/request.types';
import { AppState } from '../../store/src/app-state';
import { EntityServiceFactory } from '../src/core/entity-service-factory.service';
import { RequestSectionKeys } from '../../store/src/reducers/api-request-reducer/types';
import { ENTITY_SERVICE } from '../src/shared/entity.tokens';

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
