import { compose } from '@ngrx/store';

import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  getPaginationEntityState,
  getPaginationKeyState,
  getPaginationState,
} from '../../../store/src/selectors/pagination.selectors';
import { CF_ENDPOINT_TYPE } from '../../cf-types';

export function selectCfPaginationState(entityType: string, paginationKey: string) {
  const entityKey = entityCatalogue.getEntityKey(entityType, CF_ENDPOINT_TYPE);
  const state = compose(
    getPaginationKeyState(paginationKey),
    getPaginationEntityState(entityKey),
    getPaginationState
  );
  return state;
}
