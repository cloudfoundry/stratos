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
        metadata: { created_at: '', guid: '', updated_at: '', url: '' }
      },
      entityRequestInfo: getDefaultRequestState()
    });
  // Signal-native shim: card-cf-org-user-details and other org-detail consumers
  // read scalar fields off cfOrgService.orgDataService.org() directly. Returns
  // null so templates render their `?` chains as empty.
  orgDataService = {
    org: () => null,
    spaces: () => [],
    isLoading: () => false,
    errors: () => [],
    load: () => observableOf(undefined),
  };
  apps$ = observableOf([]);
  appCount$ = observableOf(0);
  serviceInstancesCount$ = observableOf(0);
  userProvidedServiceInstancesCount$ = observableOf(0);
}
