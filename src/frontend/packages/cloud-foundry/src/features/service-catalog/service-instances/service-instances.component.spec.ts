import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServiceSummaryCardComponent } from '@stratosui/shared/components/cards/service-summary-card/service-summary-card.component';
import { ServiceIconComponent } from '@stratosui/shared/components/service-icon/service-icon.component';
import { ServiceActionHelperService } from '@stratosui/shared/data-services/service-action-helper.service';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceInstancesComponent } from "./service-instances.component";
describe('ServiceInstancesComponent', () => {
  let component: ServiceInstancesComponent;
  let fixture: ComponentFixture<ServiceInstancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServiceInstancesComponent,
        ServiceSummaryCardComponent,
        ServiceIconComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe,
        ServiceActionHelperService,
        provideZonelessChangeDetection(),
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
