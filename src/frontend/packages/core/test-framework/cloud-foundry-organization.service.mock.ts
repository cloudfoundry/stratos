import { Observable, of as observableOf } from 'rxjs';
import { EntityInfo, APIResource } from '../../store/src/types/api.types';
import { getDefaultRequestState } from '../../store/src/reducers/api-request-reducer/types';
import { GetAllOrgUsers } from '../../store/src/actions/organization.actions';

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
  allOrgUsers$ = observableOf([]);
  apps$ = observableOf([]);
  appCount$ = observableOf(0);
}
