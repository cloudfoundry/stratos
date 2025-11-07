import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ApplicationDeploySourceTypes } from '../deploy-application/deploy-application-steps.types';
import { NewApplicationBaseStepComponent } from "./new-application-base-step.component";
describe('NewApplicationBaseStepComponent', () => {
  let component: NewApplicationBaseStepComponent;
  let fixture: ComponentFixture<NewApplicationBaseStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NewApplicationBaseStepComponent,
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        
        TabNavService,
        ApplicationDeploySourceTypes,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewApplicationBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
