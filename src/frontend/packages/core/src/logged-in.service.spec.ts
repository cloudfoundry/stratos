import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { CoreTestingModule } from '@test-framework/core-test.modules';
import { CoreModule } from './core/core.module';
import { CurrentUserPermissionsService } from './core/permissions/current-user-permissions.service';
import { LoggedInService } from './logged-in.service';

describe('LoggedInService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggedInService,
        CurrentUserPermissionsService,
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ],
      imports: [
        CoreModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([LoggedInService], (service: LoggedInService) => {
    expect(service).toBeTruthy();
  }));
});
