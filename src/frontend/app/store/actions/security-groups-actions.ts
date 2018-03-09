import { CFStartAction } from '../types/request.types';
import { PaginatedAction } from '../types/pagination.types';
import { RequestOptions } from '@angular/http';
import { schema } from 'normalizr';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { getActions } from './action.helper';

export const SecurityGroupSchema = new schema.Entity('securityGroup', {}, {
  idAttribute: getAPIResourceGuid
});


export class GetAllSecurityGroups extends CFStartAction implements PaginatedAction {
  constructor(public endpointGuid: string, public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `security_groups`;
    this.options.method = 'get';
  }
  actions = getActions('Security Groups', 'Fetch all');
  entity = [SecurityGroupSchema];
  entityKey = SecurityGroupSchema.key;
  options: RequestOptions;
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1',
    page: 1
  };
}

