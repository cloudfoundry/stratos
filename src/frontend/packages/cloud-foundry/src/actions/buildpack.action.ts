import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { buildpackEntityType } from '../cf-entity-types';
import { CFStartAction } from './cf-action.types';

export class FetchAllBuildpacks extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string) {
    super();
    this.options = new HttpRequest(
      'GET',
      'buildpacks'
    );
  }
  actions = getActions('Buildpacks', 'List all');
  entity = [cfEntityFactory(buildpackEntityType)];
  entityType = buildpackEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'position',
  };
  flattenPagination = true;
}
