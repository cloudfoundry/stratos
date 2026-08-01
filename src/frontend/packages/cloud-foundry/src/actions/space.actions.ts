import { HttpParams, HttpRequest } from '@angular/common/http';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { spaceEntityType, spaceWithOrgEntityType } from '../cf-entity-types';
import { EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export const GET_SPACES = '[Space] Get all';
export const GET_SPACES_SUCCESS = '[Space] Get all success';
export const GET_SPACES_FAILED = '[Space] Get all failed';

export const DELETE_SPACE = '[Space] Delete';
export const DELETE_SPACE_SUCCESS = '[Space] Delete Success';
export const DELETE_SPACE_FAILED = '[Space] Delete Failed';

export class GetAllSpaces extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid?: string,
    public includeRelations: string[] = [],
    public populateMissing = true,
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/spaces/${endpointGuid}`
    );
  }
  actions = [GET_SPACES, GET_SPACES_SUCCESS, GET_SPACES_FAILED];
  entity = [cfEntityFactory(spaceWithOrgEntityType)];
  schemaKey = spaceWithOrgEntityType;
  entityType = spaceEntityType;
  options: HttpRequest<any>;
  initialParams = {
    'results-per-page': 100,
    'order-direction': 'asc',
    'order-direction-field': 'name',
    'order-by': 'name'
  };
}

export abstract class BaseSpaceAction extends CFStartAction implements ICFAction {
  actions!: string[];
  entity = [cfEntityFactory(spaceEntityType)];
  entityType = spaceEntityType;
  options!: HttpRequest<any>;
  removeEntityOnDelete?: boolean;
  constructor(public guid: string, public orgGuid: string, public endpointGuid: string) {
    super();
  }
}

export class DeleteSpace extends BaseSpaceAction {
  constructor(guid: string, orgGuid: string, endpointGuid: string) {
    super(guid, orgGuid, endpointGuid);
    this.options = new HttpRequest(
      'DELETE',
      `/pp/v1/cf/spaces/${endpointGuid}/${guid}`,
      {
        params: new HttpParams({
          fromObject: {
            recursive: 'true',
            async: 'false'
          }
        })
      }
    );
  }
  actions = [DELETE_SPACE, DELETE_SPACE_SUCCESS, DELETE_SPACE_FAILED];
  removeEntityOnDelete = true;
}
