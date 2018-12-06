import { Observable, of as observableOf } from 'rxjs';

import { GetAllOrgUsers } from '../store/actions/organization.actions';
import { getDefaultRequestState } from '../store/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../store/types/api.types';

export class CloudFoundryOrganizationServiceMock {
  org$: Observable<EntityInfo<APIResource<any>>> = observableOf(
    {
      entity: {
        entity: {
          spaces: [],
          status: ''
        },
        metadata: null
      },
      entityRequestInfo: getDefaultRequestState()
    });
  allOrgUsersAction = new GetAllOrgUsers('guid', 'guid-key', 'guid', true);
  allOrgUsers = {};
}
