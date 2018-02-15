import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  generateTestCfEndpointServiceProvider,
  generateTestCfUserServiceProvider,
  getBaseTestModulesNoShared,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { MetadataItemComponent } from '../../../../metadata-item/metadata-item.component';
import { CfOrgCardComponent } from './cf-org-card.component';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';

describe('CfOrgCardComponent', () => {
  let component: CfOrgCardComponent;
  let fixture: ComponentFixture<CfOrgCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CfOrgCardComponent, MetadataItemComponent],
      imports: [...getBaseTestModulesNoShared],
      providers: [PaginationMonitorFactory, EntityMonitorFactory, generateTestCfUserServiceProvider(),
        CfOrgSpaceDataService, generateTestCfEndpointServiceProvider(), EntityServiceFactory]
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
        quota_definition: {
          entity: {
            memory_limit: 1000,
            app_instance_limit: -1,
            instance_memory_limit: -1,
            name: ''
          },
          metadata: null
        }
      },
      metadata: null
    };
    fixture.detectChanges();
  });

  it('should create', () => {

    expect(component).toBeTruthy();
  });
});
