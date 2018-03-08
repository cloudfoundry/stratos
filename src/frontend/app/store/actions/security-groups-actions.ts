import { RequestOptions } from '@angular/http';

import { entityFactory, securityGroupSchemaKey, spaceSchemaKey } from '../helpers/entity-factory';
import { createEntityRelationKey, EntityInlineParentAction } from '../helpers/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';
import { getActions } from './action.helper';

export class GetAllSecurityGroups extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string,
    public paginationKey: string,
    public includeRelations: string[] = [
      createEntityRelationKey(securityGroupSchemaKey, spaceSchemaKey)
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `security_groups`;
    this.options.method = 'get';
  }
  actions = getActions('Security Groups', 'Fetch all');
  entity = [entityFactory(securityGroupSchemaKey)];
  entityKey = securityGroupSchemaKey;
  options: RequestOptions;
  initialParams = {
    'results-per-page': 100,
    page: 1
  };
}
