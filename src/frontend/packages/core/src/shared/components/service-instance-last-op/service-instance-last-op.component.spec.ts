import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceInstanceLastOpComponent } from './service-instance-last-op.component';

describe('ServiceInstanceLastOpComponent', () => {
  let component: ServiceInstanceLastOpComponent;
  let fixture: ComponentFixture<ServiceInstanceLastOpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceInstanceLastOpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstanceLastOpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
