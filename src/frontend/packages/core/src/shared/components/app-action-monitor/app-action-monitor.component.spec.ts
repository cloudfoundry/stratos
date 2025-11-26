import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { AppActionMonitorComponent } from './app-action-monitor.component';

describe('AppActionMonitorComponent', () => {
  let component: AppActionMonitorComponent<unknown>;
  let fixture: ComponentFixture<AppActionMonitorComponent<unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection()
      ],
      imports: [
        ...BaseTestModules,
        AppActionMonitorComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppActionMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
