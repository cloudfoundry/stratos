import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
  MetadataCardTestComponents,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { CfSpaceQuotaCardComponent } from './cf-space-quota-card.component';

describe('CfSpaceQuotaCardComponent', () => {
  let component: CfSpaceQuotaCardComponent;
  let fixture: ComponentFixture<CfSpaceQuotaCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfSpaceQuotaCardComponent, MetadataCardTestComponents],
      imports: [...BaseTestModulesNoShared],
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfSpaceQuotaCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        guid: '',
        name: 'test0',
        memory_limit: 1000,
        app_instance_limit: -1,
        instance_memory_limit: -1,
        total_services: -1,
        total_routes: -1,
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
