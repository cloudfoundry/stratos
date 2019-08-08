import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import {
  ServiceBrokerCardComponent,
} from '../../../shared/components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceSummaryCardComponent,
} from '../../../shared/components/cards/service-summary-card/service-summary-card.component';
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
        ServiceSummaryCardComponent,
        ServiceBrokerCardComponent
      ],
      imports: generateCfBaseTestModules(),
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
