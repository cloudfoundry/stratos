import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { endpointEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { stackEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { createEntityRelationKey } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export const GET = '[Stack] Get one';
export const GET_SUCCESS = '[Stack] Get one success';
export const GET_FAILED = '[Stack] Get one failed';

export class GetStack extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new HttpRequest(
      'GET',
      `stacks/${guid}`
    );
  }
  actions = [
    GET,
    GET_SUCCESS,
    GET_FAILED
  ];
  entity = [entityCatalog.getEntity(CF_ENDPOINT_TYPE, stackEntityType).getSchema()];
  entityType = stackEntityType;
  options: HttpRequest<any>;
}
export class GetAllStacks extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string) {
    super();
    this.options = new HttpRequest(
      'GET',
      'stacks'
    );
    this.paginationKey = createEntityRelationKey(endpointEntityType, endpointGuid);
  }
  paginationKey: string;
  actions = getActions('Stack', 'Fetch all');
  entity = [entityCatalog.getEntity(CF_ENDPOINT_TYPE, stackEntityType).getSchema()];
  entityType = stackEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
