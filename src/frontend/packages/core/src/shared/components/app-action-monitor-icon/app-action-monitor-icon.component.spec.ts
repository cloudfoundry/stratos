import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { BaseTestModules, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { AppActionMonitorIconComponent, IActionMonitorComponentState } from './app-action-monitor-icon.component';

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the [state] input straight through to currentState', async () => {
    const state: IActionMonitorComponentState = { busy: true, error: false, completed: false, message: 'Working' };
    fixture.componentRef.setInput('state', of(state));
    await fixture.whenStable();
    let seen: IActionMonitorComponentState | undefined;
    component.currentState.subscribe(s => (seen = s));
    expect(seen).toEqual(state);
  });
});
