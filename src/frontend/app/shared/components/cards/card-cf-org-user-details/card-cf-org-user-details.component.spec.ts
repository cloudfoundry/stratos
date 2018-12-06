import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import {
  generateTestCfEndpointServiceProvider,
  BaseTestModulesNoShared,
  MetadataCardTestComponents,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganizationServiceMock } from '../../../../test-framework/cloud-foundry-organization.service.mock';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CfUserService } from '../../../data-services/cf-user.service';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { CardCfOrgUserDetailsComponent } from './card-cf-org-user-details.component';
import { CapitalizeFirstPipe } from '../../../pipes/capitalizeFirstLetter.pipe';

describe('CardCfOrgUserDetailsComponent', () => {
  let component: CardCfOrgUserDetailsComponent;
  let fixture: ComponentFixture<CardCfOrgUserDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardCfOrgUserDetailsComponent, ...MetadataCardTestComponents, CapitalizeFirstPipe],
      imports: [...BaseTestModulesNoShared],
      providers: [
        CfUserService,
        generateTestCfEndpointServiceProvider(),
        EntityServiceFactory,
        CfOrgSpaceDataService,
        CfUserService,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfOrgUserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
