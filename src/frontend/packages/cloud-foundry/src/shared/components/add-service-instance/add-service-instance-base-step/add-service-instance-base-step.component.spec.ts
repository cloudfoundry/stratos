import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PageHeaderModule, SteppersModule } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from "@test-framework/cf";
import { AddServiceInstanceBaseStepComponent } from "./add-service-instance-base-step.component";

describe('AddServiceInstanceBaseStepComponent', () => {
  let component: AddServiceInstanceBaseStepComponent;
  let fixture: ComponentFixture<AddServiceInstanceBaseStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddServiceInstanceBaseStepComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          generateCfBaseTestModulesNoShared(),
          PageHeaderModule,
          SteppersModule
        ),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
