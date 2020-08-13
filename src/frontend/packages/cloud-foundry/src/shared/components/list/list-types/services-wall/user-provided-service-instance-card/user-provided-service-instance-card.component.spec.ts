import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from '../../../../../../features/services/services/services-wall.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../services/cloud-foundry-user-provided-services.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { UserProvidedServiceInstanceCardComponent } from './user-provided-service-instance-card.component';

describe('UserProvidedServiceInstanceCardComponent', () => {
  let component: UserProvidedServiceInstanceCardComponent;
  let fixture: ComponentFixture<UserProvidedServiceInstanceCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProvidedServiceInstanceCardComponent, CfOrgSpaceLinksComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        ServicesWallService,
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        ServiceActionHelperService,
        CloudFoundryUserProvidedServicesService,
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProvidedServiceInstanceCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        space_guid: '',
        name: '',
        credentials: {},
        syslog_drain_url: '',
        space_url: '',
        routes: [],
        space: {
          entity: {
            name: '',
            organization_guid: '',
            allow_ssh: false,
            organization_url: '',
            developers_url: '',
            managers_url: '',
            auditors_url: '',
            apps_url: '',
            routes_url: '',
            domains_url: '',
            service_instances_url: '',
            app_events_url: '',
            security_groups_url: '',
            staging_security_groups_url: '',
          },
          metadata: {
            created_at: '',
            guid: '',
            updated_at: '',
            url: ''
          }
        },
        type: '',
        tags: [],
        service_bindings: [],
        service_bindings_url: '',
        routes_url: '',
        route_service_url: ''
      },
      metadata: {
        created_at: '',
        guid: '',
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
