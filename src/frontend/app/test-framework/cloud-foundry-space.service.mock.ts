import { Observable } from 'rxjs/Observable';
import { APIResource, EntityInfo } from '../store/types/api.types';
import { ISpace } from '../core/cf-api.types';

export class CloudFoundrySpaceServiceMock {

  space$: Observable<any> = Observable.of(
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
}
