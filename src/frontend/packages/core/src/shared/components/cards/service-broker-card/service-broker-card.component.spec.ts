import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceBrokerCardComponent } from './service-broker-card.component';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { MetadataCardTestComponents, BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';

describe('ServiceBrokerCardComponent', () => {
  let component: ServiceBrokerCardComponent;
  let fixture: ComponentFixture<ServiceBrokerCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceBrokerCardComponent,
        MetadataCardTestComponents,
        BooleanIndicatorComponent,
      ],
      imports: [
        BaseTestModulesNoShared
      ],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
