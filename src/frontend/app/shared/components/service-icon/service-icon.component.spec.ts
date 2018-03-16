import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceIconComponent } from './service-icon.component';

describe('ServiceIconComponent', () => {
  let component: ServiceIconComponent;
  let fixture: ComponentFixture<ServiceIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
