import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { testSessionData } from '@stratosui/store/testing';

import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { MetadataCardTestComponents } from '../../../../../../../../core/test-framework/core-test.helper';
import { VerifiedSession } from '../../../../../../../../store/src/actions/auth.actions';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import {
  generateCfBaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { CfOrgCardComponent } from './cf-org-card.component';

describe('CfOrgCardComponent', () => {
  let component: CfOrgCardComponent;
  let fixture: ComponentFixture<CfOrgCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CfOrgCardComponent,
        MetadataCardTestComponents
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        PaginationMonitorFactory,
        EntityMonitorFactory,
        generateTestCfUserServiceProvider(),
        CfOrgSpaceDataService,
        generateTestCfEndpointServiceProvider(),
        EntityServiceFactory,
        ConfirmationDialogService
      ]
    })
      .compileComponents();

    const store = TestBed.get(Store);
    store.dispatch(new VerifiedSession(testSessionData));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfOrgCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        spaces: [{
          metadata: {
            guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
            url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
            created_at: '2017-10-10T09:28:48Z',
            updated_at: '2017-10-10T09:28:48Z'
          },
          entity: {
            name: 'dev',
            organization_guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
            organization: {
              metadata: {
                guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
                url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
                created_at: '2017-10-10T09:28:45Z',
                updated_at: '2017-10-10T09:28:45Z'
              },
              entity: {
                name: 'SUSE',
                billing_enabled: false,
                quota_definition_guid: '522ee75f-b100-4f92-9801-74a3dc17fd6d',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/522ee75f-b100-4f92-9801-74a3dc17fd6d',
                spaces_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/spaces',
                domains_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/domains',
                private_domains_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/private_domains',
                users_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/users',
                managers_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/managers',
                billing_managers_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/billing_managers',
                auditors_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/auditors',
                app_events_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/app_events',
                space_quota_definitions_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/space_quota_definitions',
                domains: []
              }
            },
            developers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/developers',
            developers: [
              {
                metadata: {
                  guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  created_at: '2017-10-10T09:17:30Z',
                  updated_at: '2017-10-10T09:17:30Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/spaces',
                  organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/organizations',
                  managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_organizations',
                  managed_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_spaces',
                  audited_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/managers',
            managers: [
              {
                metadata: {
                  guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  created_at: '2017-10-10T09:17:30Z',
                  updated_at: '2017-10-10T09:17:30Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/spaces',
                  organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/organizations',
                  managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_organizations',
                  managed_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_spaces',
                  audited_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/auditors',
            auditors: [],
            apps_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/apps',
            routes_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/routes',
            routes: [
              {
                metadata: {
                  guid: '255dd039-2a61-440b-a1d1-3cac1d6784da',
                  url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da',
                  created_at: '2017-10-10T09:31:59Z',
                  updated_at: '2017-10-10T09:31:59Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: 'ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  space_guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  space_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
                  apps_url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da/apps',
                  route_mappings_url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/domains',
            domains: [
              {
                metadata: {
                  guid: 'ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  url: '/v2/shared_domains/ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/service_instances',
            service_instances: [],
            app_events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/app_events',
            events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/events',
            security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: '40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/spaces',
                  staging_spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/spaces',
                  staging_spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  created_at: '2017-10-10T09:17:26Z',
                  updated_at: '2017-10-10T09:17:27Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.117',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/spaces',
                  staging_spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: '40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/spaces',
                  staging_spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/spaces',
                  staging_spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  created_at: '2017-10-10T09:17:26Z',
                  updated_at: '2017-10-10T09:17:27Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.117',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/spaces',
                  staging_spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/staging_spaces'
                }
              }
            ]
          }
        }],
        guid: '',
        cfGuid: '',
        name: 'test0',
        private_domains: [{
          entity: {
            guid: 'test',
            cfGuid: 'test'
          },
          metadata: null
        }],
        quota_definition: {
          entity: {
            memory_limit: 1000,
            app_instance_limit: -1,
            instance_memory_limit: -1,
            name: '',
            trial_db_allowed: true,
            app_task_limit: 1,
            total_service_keys: 1,
            total_reserved_route_ports: 1,
            total_services: -1,
            total_routes: -1
          },
          metadata: null
        }
      },
      metadata: {
        guid: '',
        created_at: '',
        updated_at: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
