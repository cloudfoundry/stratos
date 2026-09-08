import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StratosBrandingService } from './stratos-branding.service';

describe('StratosBrandingService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('leaves no timer behind when its injector is destroyed', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(StratosBrandingService);
    // The constructor arms the FOUC-guard timeout that removes the
    // `theme-initializing` class from document.body.
    expect(vi.getTimerCount()).toBe(1);

    // Destroying the injector (what TestBed does between spec files, and what
    // the app does on teardown) must take the timer with it: otherwise it
    // fires into a document that no longer exists.
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });
});
