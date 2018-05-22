import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceSummaryComponent } from './service-summary.component';

describe('ServiceSummaryComponent', () => {
  let component: ServiceSummaryComponent;
  let fixture: ComponentFixture<ServiceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
