import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { UaaSetupDataService, UaaSetupState } from '../uaa-setup-data.service';
import { UaaSetupSignalService } from './uaa-setup-signal.service';

function makeUaaSetupState(overrides: Partial<UaaSetupState> = {}): UaaSetupState {
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
  let stateSignal: ReturnType<typeof signal<UaaSetupState>>;

  beforeEach(() => {
    stateSignal = signal<UaaSetupState>(makeUaaSetupState());
    const stubData = { state: stateSignal.asReadonly() };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: UaaSetupDataService, useValue: stubData },
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
    stateSignal.set(makeUaaSetupState({
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
