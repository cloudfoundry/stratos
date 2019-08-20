import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../../../core/tab-nav.service';
import { BaseTestModules } from '../../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundrySpaceServiceMock,
} from '../../../../../../../../../core/test-framework/cloud-foundry-space.service.mock';
import { ActiveRouteCfOrgSpace } from '../../../../../cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceSummaryComponent } from './cloud-foundry-space-summary.component';

describe('CloudFoundrySpaceSummaryComponent', () => {
  let component: CloudFoundrySpaceSummaryComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceSummaryComponent],
      imports: [...BaseTestModules],
      providers: [
        ActiveRouteCfOrgSpace,
        CloudFoundryEndpointService,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        CloudFoundryOrganizationService,
        TabNavService
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
