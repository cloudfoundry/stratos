import { compose } from '@ngrx/store';

import {
  getPaginationEntityState,
  getPaginationKeyState,
  getPaginationState,
} from '../../../../store/src/selectors/pagination.selectors';
import { getCFEntityKey } from '../../cf-entity-helpers';

export function selectCfPaginationState(entityType: string, paginationKey: string) {
  const entityKey = getCFEntityKey(entityType);
  const state = compose(
    getPaginationKeyState(paginationKey),
    getPaginationEntityState(entityKey),
    getPaginationState
  );
  return state;
}
