import { Observable, of as observableOf } from 'rxjs';

import { getDefaultRequestState, APIResource, EntityInfo } from '@stratosui/store';

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
  serviceInstancesCount$ = observableOf(0);
  userProvidedServiceInstancesCount$ = observableOf(0);
}
