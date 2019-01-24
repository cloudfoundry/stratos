import { Observable, of as observableOf } from 'rxjs';

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
  apps$ = observableOf([]);
  appCount$ = observableOf(0);
}
