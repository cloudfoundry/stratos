import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { getCfSpaceServiceMock } from '../../../../../../../../test-framework/cloud-foundry-space.service.mock';
import { ServiceActionHelperService } from '../../../../../../../shared/data-services/service-action-helper.service';
import { CloudFoundrySpaceUserServiceInstancesComponent } from './cloud-foundry-space-user-service-instances.component';

describe('CloudFoundrySpaceUserServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceUserServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUserServiceInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceUserServiceInstancesComponent],
      imports: generateCfBaseTestModules(),
      providers: [getCfSpaceServiceMock, DatePipe, ServiceActionHelperService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceUserServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
