import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceSummaryCardComponent } from './service-summary-card.component';
import { BaseTestModulesNoShared, MetadataCardTestComponents } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServiceIconComponent } from '../../service-icon/service-icon.component';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { AppChipsComponent } from '../../chips/chips.component';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';

describe('ServiceSummaryCardComponent', () => {
  let component: ServiceSummaryCardComponent;
  let fixture: ComponentFixture<ServiceSummaryCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceSummaryCardComponent,
        ServiceIconComponent,
        MetadataCardTestComponents,
        BooleanIndicatorComponent,
        AppChipsComponent,
      ],
      imports: [BaseTestModulesNoShared],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
