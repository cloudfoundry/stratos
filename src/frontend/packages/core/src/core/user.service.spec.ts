import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';
import { SharedModule, CoreModule } from '@stratosui/core';

import { UserService } from './user.service';

describe('UserService', () => {
  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        UserService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});
