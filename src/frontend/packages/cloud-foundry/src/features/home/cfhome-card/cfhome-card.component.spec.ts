import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityServiceFactory } from '@stratosui/store/entity-service-factory.service';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ApplicationDeploySourceTypes } from '../../applications/deploy-application/deploy-application-steps.types';
import { CFHomeCardComponent } from "./cfhome-card.component";
describe('CFHomeCardComponent', () => {
  let component: CFHomeCardComponent;
  let fixture: ComponentFixture<CFHomeCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CFHomeCardComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        ApplicationDeploySourceTypes,
        provideZonelessChangeDetection(),
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CFHomeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
