import { getPaginationKey } from '../../../store/actions/pagination.actions';
import { entityFactory } from '../../../store/helpers/entity-factory';
import { PaginatedAction } from '../../../store/types/pagination.types';

import { schema } from 'normalizr';

export const CAASP_INFO_ENTITY_KEY = 'caaspInfo';

export const GET_INFO = '[CAASP Endpoint] Get Info';

// export const GET_INFO_SUCCESS = '[CAASP Endpoint] Get Info Success';

export const CaaspInfoSchema = new schema.Entity(CAASP_INFO_ENTITY_KEY);

/**
 * Action to request the information for a given CaaSP cluster
 */
export class GetCaaspInfo implements PaginatedAction {
  constructor(public caaspGuid) {
    this.paginationKey = getPaginationKey(CaaspInfoSchema.key, caaspGuid);
  }
  type = GET_INFO;
  entityKey = CaaspInfoSchema.key;
  entity = [entityFactory(CaaspInfoSchema.key)];
  actions = [
    //GET_INFO,
    //GET_INFO_SUCCESS,
    //GET_INFO_SUCCESS
  ];
  paginationKey: string;
}
