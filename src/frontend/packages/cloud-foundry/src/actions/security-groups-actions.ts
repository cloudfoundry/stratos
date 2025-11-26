import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import type { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { securityGroupEntityType, spaceEntityType } from '../cf-entity-types';
import { createEntityRelationKey, type EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export class GetAllSecurityGroups extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(securityGroupEntityType, spaceEntityType)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `security_groups`
    );
  }
  actions = getActions('Security Groups', 'Fetch all');
  entity = [cfEntityFactory(securityGroupEntityType)];
  entityType = securityGroupEntityType;
  options: HttpRequest<unknown>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
