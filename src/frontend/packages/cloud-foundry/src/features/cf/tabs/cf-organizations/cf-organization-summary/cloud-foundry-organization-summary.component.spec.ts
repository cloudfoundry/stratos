import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryOrganizationServiceMock,
} from '../../../../../../test-framework/cloud-foundry-organization.service.mock';
import {
  CardCfOrgUserDetailsComponent,
} from '../../../../../shared/components/cards/card-cf-org-user-details/card-cf-org-user-details.component';
import { CfUserPermissionDirective } from '../../../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import { CardCfRecentAppsComponent } from '../../../../home/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../../../../home/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryOrganizationSummaryComponent } from './cloud-foundry-organization-summary.component';

describe('CloudFoundryOrganizationSummaryComponent', () => {
  let component: CloudFoundryOrganizationSummaryComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryOrganizationSummaryComponent,
        CardCfOrgUserDetailsComponent,
        CardCfRecentAppsComponent,
        CompactAppCardComponent,
        CfUserPermissionDirective
      ],
      imports: generateCfBaseTestModules(),
      providers: [
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        generateTestCfEndpointServiceProvider(),
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
