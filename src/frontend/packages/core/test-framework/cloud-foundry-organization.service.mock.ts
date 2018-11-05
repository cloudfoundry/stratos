import { Observable, of as observableOf } from 'rxjs';

import { GetAllOrgUsers } from '../../../store/src/actions/organization.actions';
import { getDefaultRequestState } from '../../../store/src/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../../../store/src/types/api.types';

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
