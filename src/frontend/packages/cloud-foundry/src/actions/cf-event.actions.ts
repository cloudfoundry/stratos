import { HttpParams, HttpRequest } from '@angular/common/http';

import { endpointEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { cfEventEntityType } from '../cf-entity-types';
import { createEntityRelationPaginationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export const CfGetAllEvents = {
  GET_ALL: '[Cf Event] Get all',
  GET_ALL_SUCCESS: '[Cf Event] Get all success',
  GET_ALL_FAILED: '[Cf Event] Get all failed',
};

export class GetAllCfEvents extends CFStartAction implements PaginatedAction {
  private static sortField = 'timestamp'; // This is the field that 'order-direction' is applied to. Cannot be changed

  constructor(public paginationKey: string, public endpointGuid) {
    super();
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey(endpointEntityType, endpointGuid);
    this.options = new HttpRequest(
      'GET',
      'events',
      {
        params: new HttpParams({
          fromObject: {
            '': ''
          }
        })
      }
    );
  }
  actions = [
    CfGetAllEvents.GET_ALL,
    CfGetAllEvents.GET_ALL_SUCCESS,
    CfGetAllEvents.GET_ALL_FAILED
  ];

  entity = [cfEntityFactory(cfEventEntityType)];
  entityType = cfEventEntityType;
  options: HttpRequest<any>;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': GetAllCfEvents.sortField,
    q: []
    // q: [
    //   new QParam('actee', this.appGuid, QParamJoiners.colon).toString(),
    // ]
  };
}
