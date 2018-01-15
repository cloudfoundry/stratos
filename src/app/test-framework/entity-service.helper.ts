import { IRequestAction } from '../store/types/request.types';
import { Action, Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { EntityService } from '../core/entity-service';
import { schema } from 'normalizr';

export function generateTestEntityServiceProvider(
  guid: string,
  schema: schema.Entity,
  action: IRequestAction
) {
  const useFactory = (
    store: Store<AppState>
  ) => {
    return new EntityService(
      store,
      schema.key,
      schema,
      guid,
      action
    );
  };

  return {
    provide: EntityService,
    useFactory,
    deps: [Store]
  };
}
