import { RequestOptions } from '@angular/http';

import { getActions } from '../../../store/src/actions/action.helper';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory, securityGroupEntityType, spaceEntityType } from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { EntityInlineParentAction, createEntityRelationKey } from '../entity-relations/entity-relations.types';

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
