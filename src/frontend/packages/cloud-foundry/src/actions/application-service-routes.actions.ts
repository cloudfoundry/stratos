import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  applicationEntityType,
  serviceBindingEntityType,
  serviceInstancesEntityType,
} from '../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export class GetAppServiceBindings extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public paginationKey: string = '',
    public includeRelations: string[] = [
      createEntityRelationKey(serviceBindingEntityType, applicationEntityType),
      createEntityRelationKey(serviceBindingEntityType, serviceInstancesEntityType),
    ],
    public populateMissing = true
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `apps/${guid}/service_bindings`
    );
    this.paginationKey = paginationKey || createEntityRelationPaginationKey(applicationEntityType, guid);
  }
  actions = getActions('Application Service Bindings', 'Get All');
  initialParams = {
    'results-per-page': 100,
    page: 1,
    'order-direction': 'asc',
    'order-direction-field': 'creation',
  };
  entity = [cfEntityFactory(serviceBindingEntityType)];
  entityType = serviceBindingEntityType;
  options: HttpRequest<any>;
  flattenPagination = true;
}
