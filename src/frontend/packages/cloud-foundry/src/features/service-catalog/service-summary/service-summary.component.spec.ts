import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import {
  CompactServiceInstanceCardComponent,
} from '../../../shared/components/cards/compact-service-instance-card/compact-service-instance-card.component';
import {
  ServiceBrokerCardComponent,
} from '../../../shared/components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from '../../../shared/components/cards/service-recent-instances-card/service-recent-instances-card.component';
import {
  ServiceSummaryCardComponent,
} from '../../../shared/components/cards/service-summary-card/service-summary-card.component';
import { ServiceIconComponent } from '../../../shared/components/service-icon/service-icon.component';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceSummaryComponent } from "./service-summary.component";
describe('ServiceSummaryComponent', () => {
  let component: ServiceSummaryComponent;
  let fixture: ComponentFixture<ServiceSummaryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServiceSummaryComponent,
        ServiceSummaryCardComponent,
        ServiceBrokerCardComponent,
        ServiceRecentInstancesCardComponent,
        ServiceIconComponent,
        CompactServiceInstanceCardComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
