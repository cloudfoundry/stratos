import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundryOrganizationBaseComponent } from './cloud-foundry-organization-base.component';

describe('CloudFoundryOrganizationBaseComponent', () => {
  let component: CloudFoundryOrganizationBaseComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationBaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationBaseComponent],
      imports: generateCfBaseTestModules(),
      providers: [...generateTestCfEndpointServiceProvider(), TabNavService, CloudFoundryUserProvidedServicesService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
