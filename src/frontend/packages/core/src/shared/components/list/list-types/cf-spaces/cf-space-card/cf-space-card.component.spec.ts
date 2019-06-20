import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  BaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
  MetadataCardTestComponents,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { CfOrgCardComponent } from '../../cf-orgs/cf-org-card/cf-org-card.component';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';

describe('CfSpaceCardComponent', () => {
  let component: CfOrgCardComponent;
  let fixture: ComponentFixture<CfOrgCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfOrgCardComponent, ...MetadataCardTestComponents],
      imports: [...BaseTestModulesNoShared],
      providers: [PaginationMonitorFactory, EntityMonitorFactory, generateTestCfUserServiceProvider(),
        CfOrgSpaceDataService, generateTestCfEndpointServiceProvider(), EntityServiceFactory, ConfirmationDialogService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfOrgCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        spaces: [],
        guid: '',
        cfGuid: '',
        name: 'test',
        private_domains: [],
        quota_definition: {
          entity: {
            memory_limit: 1000,
            app_instance_limit: -1,
            instance_memory_limit: -1,
            name: '',
            trial_db_allowed: true,
            app_task_limit: 1,
            total_service_keys: 1,
            total_reserved_route_ports: 1
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
