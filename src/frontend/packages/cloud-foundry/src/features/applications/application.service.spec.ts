import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ApplicationService } from './application.service';

describe('ApplicationService', () => {
  const CF = 'cf-guid-1';
  const APP = 'app-guid-1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CF_GUID, useValue: CF },
        { provide: APP_GUID, useValue: APP },
        ApplicationService,
      ],
    });
  });

  it('exposes cfGuid and appGuid from injection tokens', () => {
    const service = TestBed.inject(ApplicationService);
    expect(service.cfGuid).toBe(CF);
    expect(service.appGuid).toBe(APP);
  });
});
