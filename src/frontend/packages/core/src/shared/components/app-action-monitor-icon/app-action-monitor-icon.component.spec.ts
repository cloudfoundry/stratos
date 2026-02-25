import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { endpointEntityType, stratosEntityFactory } from '@stratosui/store';
import { BaseTestModules, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { AppActionMonitorIconComponent } from './app-action-monitor-icon.component';

describe('AppActionMonitorIconComponent', () => {
  let component: AppActionMonitorIconComponent;
  let fixture: ComponentFixture<AppActionMonitorIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection()
      ],
      imports: [
        ...BaseTestModules,
        AppActionMonitorIconComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppActionMonitorIconComponent);
    component = fixture.componentInstance;
    component.id = '1';
    component.schema = stratosEntityFactory(endpointEntityType);
    // Don't call detectChanges() yet - component needs inputs set first
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
