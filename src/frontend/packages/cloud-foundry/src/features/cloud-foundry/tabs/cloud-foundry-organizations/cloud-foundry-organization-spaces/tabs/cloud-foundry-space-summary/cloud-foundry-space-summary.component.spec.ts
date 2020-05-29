import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../../../core/tab-nav.service';
import {
  generateActiveRouteCfOrgSpaceMock,
  generateCfBaseTestModules,
} from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../../test-framework/cloud-foundry-space.service.mock';
import {
  CardCfRecentAppsComponent,
} from '../../../../../../../shared/components/cards/card-cf-recent-apps/card-cf-recent-apps.component';
import {
  CompactAppCardComponent,
} from '../../../../../../../shared/components/cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import {
  CardCfSpaceDetailsComponent,
} from '../../../../../../../shared/components/cards/card-cf-space-details/card-cf-space-details.component';
import { CfUserService } from '../../../../../../../shared/data-services/cf-user.service';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceSummaryComponent } from './cloud-foundry-space-summary.component';

describe('CloudFoundrySpaceSummaryComponent', () => {
  let component: CloudFoundrySpaceSummaryComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceSummaryComponent, CardCfSpaceDetailsComponent, CardCfRecentAppsComponent, CompactAppCardComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        generateActiveRouteCfOrgSpaceMock(),
        CloudFoundryEndpointService,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        CloudFoundryOrganizationService,
        TabNavService,
        CfUserService,
        CloudFoundryUserProvidedServicesService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
