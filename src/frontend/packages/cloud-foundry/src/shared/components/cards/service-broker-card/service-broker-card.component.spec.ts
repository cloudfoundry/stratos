import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { MetadataCardTestComponents } from '../../../../../../core/test-framework/core-test.helper';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { ServiceBrokerCardComponent } from './service-broker-card.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('ServiceBrokerCardComponent', () => {
  let component: ServiceBrokerCardComponent;
  let fixture: ComponentFixture<ServiceBrokerCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        MetadataCardTestComponents,
    ],
      imports: [
        ServiceBrokerCardComponent,
        BooleanIndicatorComponent,
        generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        EntityServiceFactory,
        
        { provide: ServicesService, useClass: ServicesServiceMock },
        EntityMonitorFactory,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
