import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { getCfSpaceServiceMock } from '../../../../../../../../../core/test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceServiceInstancesComponent } from './cloud-foundry-space-service-instances.component';

describe('CloudFoundrySpaceServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceServiceInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceServiceInstancesComponent],
      imports: [...BaseTestModules],
      providers: [getCfSpaceServiceMock, DatePipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
