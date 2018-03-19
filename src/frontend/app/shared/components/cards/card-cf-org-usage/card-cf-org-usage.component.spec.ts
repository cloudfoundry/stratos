import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organisation.service';
import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModulesNoShared,
  getMetadataCardComponents,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationServiceMock } from '../../../../test-framework/cloud-foundry-organisation.service.mock';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CfUserService } from '../../../data-services/cf-user.service';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { CardCfOrgUsageComponent } from './card-cf-org-usage.component';
import { getBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CardCfOrgUsageComponent', () => {
  let component: CardCfOrgUsageComponent;
  let fixture: ComponentFixture<CardCfOrgUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardCfOrgUsageComponent, ...getMetadataCardComponents],
      imports: [...getBaseTestModulesNoShared],
      providers: [
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        generateTestCfEndpointServiceProvider(),
        EntityServiceFactory,
        CfOrgSpaceDataService,
        CfUserService,
        PaginationMonitorFactory,
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfOrgUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
