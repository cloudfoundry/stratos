import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { getCfSpaceServiceMock } from '../../../../../../../../../core/test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceUserServiceInstancesComponent } from './cloud-foundry-space-user-service-instances.component';

describe('CloudFoundrySpaceUserServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceUserServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUserServiceInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceUserServiceInstancesComponent],
      imports: [...BaseTestModules],
      providers: [getCfSpaceServiceMock, DatePipe]
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
