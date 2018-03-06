import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceServiceInstancesComponent } from './cloud-foundry-space-service-instances.component';

describe('CloudFoundrySpaceServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceServiceInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundrySpaceServiceInstancesComponent ]
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
