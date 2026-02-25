import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ConfirmationDialogService,
  CurrentUserPermissionsService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock, generateCfStoreModules } from '@test-framework/cf';
import { CFAppState } from '../../../../../cf-app-state';
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
          useFactory: (
            store: Store<CFAppState>,
            appService: ApplicationService,
            confirmDialog: ConfirmationDialogService,
            datePipe: DatePipe,
            activatedRoute: ActivatedRoute,
            cups: CurrentUserPermissionsService) => {
            return new CfAppMapRoutesListConfigService(store, appService, confirmDialog, datePipe, activatedRoute, cups);
          },
          deps: [Store, ApplicationService, ConfirmationDialogService, DatePipe, ActivatedRoute, CurrentUserPermissionsService]
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
