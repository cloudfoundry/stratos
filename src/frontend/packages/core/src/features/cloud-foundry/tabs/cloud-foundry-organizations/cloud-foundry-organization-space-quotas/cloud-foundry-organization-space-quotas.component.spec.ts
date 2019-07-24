import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CfSpaceQuotasListConfigService,
} from '../../../../../shared/components/list/list-types/cf-space-quotas/cf-space-quotas-list-config.service';
import { CloudFoundryOrganizationSpaceQuotasComponent } from './cloud-foundry-organization-space-quotas.component';

describe('CloudFoundryOrganizationSpaceQuotasComponent', () => {
  let component: CloudFoundryOrganizationSpaceQuotasComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpaceQuotasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSpaceQuotasComponent],
      providers: [CfSpaceQuotasListConfigService, generateTestCfEndpointServiceProvider(), TabNavService, DatePipe],
      imports: [...BaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSpaceQuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
