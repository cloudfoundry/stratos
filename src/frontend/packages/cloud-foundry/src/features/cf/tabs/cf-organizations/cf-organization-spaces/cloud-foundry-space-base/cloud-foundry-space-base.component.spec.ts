import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../../../../../core/src/tab-nav.service';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../../shared/services/cloud-foundry-user-provided-services.service';
import { CloudFoundrySpaceBaseComponent } from './cloud-foundry-space-base.component';

describe('CloudFoundrySpaceBaseComponent', () => {
  let component: CloudFoundrySpaceBaseComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceBaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceBaseComponent],
      imports: generateCfBaseTestModules(),
      providers: [generateTestCfEndpointServiceProvider(), TabNavService, CloudFoundryUserProvidedServicesService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
