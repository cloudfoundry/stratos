import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { AppActionMonitorComponent } from './app-action-monitor.component';

describe('AppActionMonitorComponent', () => {
  let component: AppActionMonitorComponent<any>;
  let fixture: ComponentFixture<AppActionMonitorComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ...BaseTestModules,
        AppActionMonitorComponent
      ]
    })
      .compileComponents();
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
