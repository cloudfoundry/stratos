import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceServiceInstancesComponent } from './cloud-foundry-space-service-instances.component';
import { BaseTestModules, getCfSpaceServiceMock } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CloudFoundrySpaceServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceServiceInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceServiceInstancesComponent],
      imports: [...BaseTestModules],
      providers: [getCfSpaceServiceMock]
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
