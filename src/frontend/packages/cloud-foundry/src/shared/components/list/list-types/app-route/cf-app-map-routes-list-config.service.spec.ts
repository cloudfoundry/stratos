import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ConfirmationDialogService,
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock, generateCfStoreModules } from '@test-framework/cf';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppMapRoutesListConfigService } from './cf-app-map-routes-list-config.service';

describe('CfAppMapRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => 'test-space-guid'
              }
            }
          }
        },
        {
          provide: CfAppMapRoutesListConfigService,
          useFactory: () => new CfAppMapRoutesListConfigService(),
        },
        DatePipe,
        ConfirmationDialogService,
        ...cfCurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppMapRoutesListConfigService);
    expect(service).toBeTruthy();
  });
});
