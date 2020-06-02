import { Observable, of as observableOf } from 'rxjs';

import { CloudFoundrySpaceService } from '../src/features/cloud-foundry/services/cloud-foundry-space.service';

export class CloudFoundrySpaceServiceMock {

  space$: Observable<any> = observableOf(
    {
      entity: {
        entity: {
          name: '',
          organization_guid: '',
          allow_ssh: true,
          organization_url: '',
          organization: null,
          developers_url: '',
          developers: [],
          managers_url: '',
          managers: [],
          auditors_url: '',
          auditors: [],
          apps_url: '',
          apps: [],
          routes_url: '',
          domains_url: '',
          domains: [],
          service_instances_url: '',
          service_instances: [],
          app_events_url: '',
          events_url: '',
          security_groups_url: '',
          security_groups: [],
          staging_security_groups_url: '',
          staging_security_groups: [],
          guid: '',
          cfGuid: '',
        },
        metadata: null
      }

    });
  allowSsh$ = observableOf('false');
  apps$ = observableOf([]);
  appCount$ = observableOf(0);
  serviceInstancesCount$ = observableOf(0);
  userProvidedServiceInstancesCount$ = observableOf(0);

}

export const getCfSpaceServiceMock = {
  provide: CloudFoundrySpaceService,
  useClass: CloudFoundrySpaceServiceMock
};
