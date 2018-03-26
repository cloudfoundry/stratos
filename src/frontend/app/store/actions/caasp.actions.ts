import { Schema, schema } from 'normalizr';

import { PaginatedAction } from '../types/pagination.types';
import { getPaginationKey } from './pagination.actions';
import { entityFactory, caaspInfoSchemaKey } from '../helpers/entity-factory';

export const CAASP_INFO_ENTITY_KEY = 'caaspInfo';

export const GET_INFO = '[CAASP Endpoint] Get Info';

/**
 * Action to request the information for a given CaaSP cluster
 */
export class GetCaaspInfo implements PaginatedAction {
  constructor(public caaspGuid) {
    console.log('HELLO');
    console.log(this.constructor.name);
    this.paginationKey = getPaginationKey(caaspInfoSchemaKey, caaspGuid);
  }
  type = GET_INFO;
  entity = entityFactory(caaspInfoSchemaKey);
  entityKey = caaspInfoSchemaKey;
  actions = [
    //GET_INFO,
    //GET_INFO_SUCCESS,
    //GET_INFO_SUCCESS
  ];
  paginationKey: string;
}
