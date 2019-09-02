import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  ServiceSummaryCardComponent,
} from '../../../shared/components/cards/service-summary-card/service-summary-card.component';
import { ServiceIconComponent } from '../../../shared/components/service-icon/service-icon.component';
import { ServiceActionHelperService } from '../../../shared/data-services/service-action-helper.service';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceInstancesComponent } from './service-instances.component';

describe('ServiceInstancesComponent', () => {
  let component: ServiceInstancesComponent;
  let fixture: ComponentFixture<ServiceInstancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceInstancesComponent,
        ServiceSummaryCardComponent,
        ServiceIconComponent
      ],
      imports: generateCfBaseTestModules(),
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe,
        ServiceActionHelperService
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
