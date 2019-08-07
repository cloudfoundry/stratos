import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceInstancesComponent } from './service-instances.component';

describe('ServiceInstancesComponent', () => {
  let component: ServiceInstancesComponent;
  let fixture: ComponentFixture<ServiceInstancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceInstancesComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
