import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import type { UAASetupState } from '@stratosui/store';

import { UaaSetupSignalService } from './uaa-setup-signal.service';

function makeUaaSetupState(overrides: Partial<UAASetupState> = {}): UAASetupState {
  return {
    payload: null,
    setup: false,
    error: false,
    message: '',
    settingUp: false,
    ...overrides,
  };
}

describe('UaaSetupSignalService', () => {
  let uaaSetup$: BehaviorSubject<UAASetupState>;

  beforeEach(() => {
    uaaSetup$ = new BehaviorSubject<UAASetupState>(makeUaaSetupState());
    const stubStore = {
      select: () => uaaSetup$.asObservable(),
      dispatch: () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        UaaSetupSignalService,
      ],
    });
  });

  it('exposes default uaaSetup signals', () => {
    const service = TestBed.inject(UaaSetupSignalService);
    expect(service.setup()).toBe(false);
    expect(service.settingUp()).toBe(false);
    expect(service.error()).toBe(false);
    expect(service.message()).toBe('');
    expect(service.payload()).toBeNull();
  });

  it('reflects uaaSetup updates through projected signals', () => {
    uaaSetup$.next(makeUaaSetupState({
      setup: true,
      settingUp: false,
      error: true,
      message: 'boom',
    }));

    const service = TestBed.inject(UaaSetupSignalService);
    expect(service.setup()).toBe(true);
    expect(service.error()).toBe(true);
    expect(service.message()).toBe('boom');
  });
});
