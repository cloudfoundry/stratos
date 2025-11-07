import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServicePlansComponent } from "./service-plans.component";
describe('ServicePlansComponent', () => {
  let component: ServicePlansComponent;
  let fixture: ComponentFixture<ServicePlansComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServicePlansComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        DatePipe,
        { provide: ServicesService, useClass: ServicesServiceMock },
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
