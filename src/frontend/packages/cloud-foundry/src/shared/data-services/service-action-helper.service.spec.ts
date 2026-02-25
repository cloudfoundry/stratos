import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Store, StoreModule } from '@ngrx/store';

import { ConfirmationDialogService } from '@stratosui/core';
import { appReducers } from '@stratosui/store';

import { ServiceActionHelperService } from './service-action-helper.service';

describe('ServiceActionHelperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServiceActionHelperService,
        ConfirmationDialogService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        StoreModule.forRoot(appReducers, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceActionHelperService);
    expect(service).toBeTruthy();
  });
});
