import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceSummaryComponent } from './service-summary.component';


describe('ServiceSummaryComponent', () => {
  let component: ServiceSummaryComponent;
  let fixture: ComponentFixture<ServiceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceSummaryComponent,
      ],
      imports: [BaseTestModules],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ServiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
