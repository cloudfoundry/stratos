import { RouterTestingModule } from '@angular/router/testing';
import { getInitialTestStoreState } from '../test-framework/store-test-helper';
import { appReducers } from '../store/reducers.module';
import { ResponseOptions, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Store, StoreModule } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApplicationSchema, GetApplication } from '../store/actions/application.actions';
import { TestBed, inject } from '@angular/core/testing';

import { EntityService } from './entity-service';

const applicationRes = {
  '663a363e-1faf-4359-ac96-b8c24ec1a4ab': {
    'metadata': {
      'guid': 'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
      'url': '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
      'created_at': '2017-09-30T10:37:30Z',
      'updated_at': '2017-11-06T17:43:09Z'
    },
    'entity': {
      'name': '12factor',
      'production': false,
      'space_guid': 'aa775168-7be8-4006-81e5-647d59f8ee22',
      'stack_guid': '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
      'buildpack': 'ruby_buildpack',
      'detected_buildpack': '',
      'detected_buildpack_guid': 'a1c434e4-0674-4b9a-a5e1-469553e8c702',
      'environment_json': {
        'asd': 'asd'
      },
      'memory': 64,
      'instances': 1,
      'disk_quota': 512,
      'state': 'STARTED',
      'version': 'b51a5a5a-d7dc-4d3a-9f1c-46cd3e01330d',
      'command': null,
      'console': false,
      'debug': null,
      'staging_task_id': 'b1c06621-12eb-40f7-a50b-6d609c7f92d4',
      'package_state': 'STAGED',
      'health_check_type': 'port',
      'health_check_timeout': null,
      'health_check_http_endpoint': null,
      'staging_failed_reason': null,
      'staging_failed_description': null,
      'diego': true,
      'docker_image': null,
      'docker_credentials': {
        'username': null,
        'password': null
      },
      'package_updated_at': '2017-09-30T10:37:40Z',
      'detected_start_command': 'bundle exec ruby web.rb -p $PORT',
      'enable_ssh': true,
      'ports': [8080],
      'space_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
      'space': {
        'metadata': {
          'guid': 'aa775168-7be8-4006-81e5-647d59f8ee22',
          'url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
          'created_at': '2017-09-22T15:28:41Z',
          'updated_at': '2017-09-22T15:28:41Z'
        },
        'entity': {
          'name': 'dev',
          'organization_guid': '742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
          'space_quota_definition_guid': null,
          'isolation_segment_guid': null,
          'allow_ssh': true,
          'organization_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
          'organization': {
            'metadata': {
              'guid': '742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
              'url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
              'created_at': '2017-09-22T15:28:13Z',
              'updated_at': '2017-09-22T15:28:13Z'
            },
            'entity': {
              'name': 'SUSE',
              'billing_enabled': false,
              'quota_definition_guid': '5fcd846b-7eb3-410e-ba15-35634d723ca7',
              'status': 'active',
              'default_isolation_segment_guid': null,
              'quota_definition_url': '/v2/quota_definitions/5fcd846b-7eb3-410e-ba15-35634d723ca7',
              'spaces_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/spaces',
              'domains_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/domains',
              'private_domains_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/private_domains',
              'users_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/users',
              'managers_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/managers',
              'billing_managers_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/billing_managers',
              'auditors_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/auditors',
              'app_events_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/app_events',
              'space_quota_definitions_url': '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/space_quota_definitions'
            }
          },
          'developers_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/developers',
          'managers_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/managers',
          'auditors_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/auditors',
          'apps_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/apps',
          'routes_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/routes',
          'domains_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/domains',
          'service_instances_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/service_instances',
          'app_events_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/app_events',
          'events_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/events',
          'security_groups_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/security_groups',
          'staging_security_groups_url': '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/staging_security_groups'
        }
      },
      'stack_url': '/v2/stacks/18813ebb-8907-4c3b-8ba7-26a1632e16e9',
      'stack': {
        'metadata': {
          'guid': '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
          'url': '/v2/stacks/18813ebb-8907-4c3b-8ba7-26a1632e16e9',
          'created_at': '2017-09-22T15:25:53Z',
          'updated_at': '2017-09-22T15:25:53Z'
        },
        'entity': {
          'name': 'cflinuxfs2',
          'description': 'Cloud Foundry Linux-based filesystem'
        }
      },
      'routes_url': '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/routes',
      'events_url': '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/events',
      'service_bindings_url': '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/service_bindings',
      'route_mappings_url': '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/route_mappings'
    }
  }
};
const appId = '1';
const cfId = '2';
const entityServiceFactory = (
  store: Store<AppState>
) => {
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    appId,
    new GetApplication(appId, cfId)
  );
};

describe('EntityServiceService', () => {
  beforeEach(() => {
    const initialState = getInitialTestStoreState();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityService,
          useFactory: entityServiceFactory,
          deps: [Store]
        },
        {
          provide: XHRBackend,
          useClass: MockBackend
        }
      ],
      imports: [
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ]
    });
  });

  it('should be created', inject([EntityService], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));

  it('should poll', (done) => {
    inject([EntityService, XHRBackend], (service: EntityService, mockBackend: MockBackend) => {
      mockBackend.connections.delay(100).subscribe(connection => {
        connection.mockRespond(new Response(new ResponseOptions({
          body: JSON.stringify(applicationRes)
        })));
      });
      service.poll().subscribe(a => {
        console.log(a);
        done();
      });
    });
  });
});
