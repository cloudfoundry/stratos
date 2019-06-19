import { RequestOptions } from '@angular/http';

import { cfEntityFactory, securityGroupEntityType, spaceEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { createEntityRelationKey, EntityInlineParentAction } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

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
    this.options = new RequestOptions();
    this.options.url = `security_groups`;
    this.options.method = 'get';
  }
  actions = getActions('Security Groups', 'Fetch all');
  entity = [cfEntityFactory(securityGroupEntityType)];
  entityType = securityGroupEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
  };
  flattenPagination = true;
}
