import { Schema, schema } from 'normalizr';

import { PaginatedAction } from '../types/pagination.types';

export const CAASP_INFO_ENTITY_KEY = 'caaspInfo';

export const GET_INFO = '[CAASP Endpoint] Get Info';

//export const GET_INFO_SUCCESS = '[CAASP Endpoint] Get Info Success';

export const CaaspInfoSchema = new schema.Entity(CAASP_INFO_ENTITY_KEY);

/**
 * Action to request the information for a given CaaSP cluster
 */
export class GetCaaspInfo implements PaginatedAction {
  constructor(public caaspGuid) {
    console.log('HELLO');
    console.log(this.constructor.name);
  }
  type = GET_INFO;
  entityKey = CaaspInfoSchema.key;
  actions = [
    GET_INFO,
    //GET_INFO_SUCCESS,
    //GET_INFO_SUCCESS
  ];
  paginationKey = CAASP_INFO_ENTITY_KEY;
}
