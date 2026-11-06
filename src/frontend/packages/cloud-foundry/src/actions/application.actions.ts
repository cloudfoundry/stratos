import { HttpParams, HttpRequest } from '@angular/common/http';

import { PaginatedAction, PaginationParam } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { applicationEntityType, appStatsEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { createEntityRelationPaginationKey, EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

const GET_ALL = '[Application] Get all';
const GET_ALL_SUCCESS = '[Application] Get all success';
const GET_ALL_FAILED = '[Application] Get all failed';

const DELETE = '[Application] Delete';
const DELETE_SUCCESS = '[Application] Delete success';
const DELETE_FAILED = '[Application] Delete failed';

const DELETE_INSTANCE = '[Application Instance] Delete';
const DELETE_INSTANCE_SUCCESS = '[Application Instance] Delete success';
const DELETE_INSTANCE_FAILED = '[Application Instance] Delete failed';

const applicationEntitySchema = cfEntityFactory(applicationEntityType);

export class GetAllApplications extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  private static sortField = 'creation'; // This is the field that 'order-direction' is applied to. Cannot be changed

  constructor(public paginationKey: string, public endpointGuid: string, public includeRelations: string[] = [], public populateMissing = false) {
    super();
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/apps/${endpointGuid}`
    );
    this.paginationKey = this.paginationKey || createEntityRelationPaginationKey('cf', endpointGuid);
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [applicationEntitySchema];
  entityType = applicationEntityType;
  endpointType = CF_ENDPOINT_TYPE;
  options: HttpRequest<any>;
  initialParams: PaginationParam = {
    'order-direction': 'asc',
    'order-direction-field': GetAllApplications.sortField,
    page: 1,
    'results-per-page': 100,
  };
  flattenPagination = true;
  flattenPaginationMax = true;
}

export class DeleteApplication extends CFStartAction implements ICFAction {
  static updateKey = 'Deleting-Existing-Application';

  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new HttpRequest(
      'DELETE',
      `/pp/v1/cf/apps/${endpointGuid}/${guid}`,
      null,
      {
        params: new HttpParams({
          fromObject: {
            recursive: 'true'
          }
        })
      }
    );
  }
  actions = [DELETE, DELETE_SUCCESS, DELETE_FAILED];
  entity = [applicationEntitySchema];
  entityType = applicationEntityType;
  options: HttpRequest<any>;
}
export class DeleteApplicationInstance extends CFStartAction
  implements ICFAction {
  guid: string;
  constructor(
    public appGuid: string,
    index: number,
    public endpointGuid: string
  ) {
    super();
    this.options = new HttpRequest(
      'DELETE',
      `/pp/v1/cf/apps/${endpointGuid}/${appGuid}/instances/${index}`,
      null
    );
    this.guid = `${appGuid}-${index}`;
  }
  actions = [DELETE_INSTANCE, DELETE_INSTANCE_SUCCESS, DELETE_INSTANCE_FAILED];
  entity = [cfEntityFactory(appStatsEntityType)];
  entityType = appStatsEntityType;
  removeEntityOnDelete = true;
  options: HttpRequest<any>;
}
