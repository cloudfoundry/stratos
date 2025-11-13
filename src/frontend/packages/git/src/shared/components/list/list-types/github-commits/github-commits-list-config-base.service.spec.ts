import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../../../cloud-foundry/test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../../../store/testing/src/store-test-helper';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';

describe('GithubCommitsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        GithubCommitsListConfigServiceBase,
        DatePipe,
      ],
      imports: [
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([GithubCommitsListConfigServiceBase], (service: GithubCommitsListConfigServiceBase) => {
    expect(service).toBeTruthy();
  }));
});
