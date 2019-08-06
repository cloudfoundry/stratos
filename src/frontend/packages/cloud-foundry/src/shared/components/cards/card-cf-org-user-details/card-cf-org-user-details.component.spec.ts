import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../../core/src/core/entity-service-factory.service';
import {
  BooleanIndicatorComponent,
} from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { EntityMonitorFactory } from '../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { CapitalizeFirstPipe } from '../../../../../../core/src/shared/pipes/capitalizeFirstLetter.pipe';
import {
  BaseTestModulesNoShared,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../core/test-framework/cloud-foundry-organization.service.mock';
import {
  CloudFoundryOrganizationService,
} from '../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CfUserService } from '../../../data-services/cf-user.service';
import { CardCfOrgUserDetailsComponent } from './card-cf-org-user-details.component';

describe('CardCfOrgUserDetailsComponent', () => {
  let component: CardCfOrgUserDetailsComponent;
  let fixture: ComponentFixture<CardCfOrgUserDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardCfOrgUserDetailsComponent, MetadataItemComponent, CapitalizeFirstPipe, BooleanIndicatorComponent],
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
