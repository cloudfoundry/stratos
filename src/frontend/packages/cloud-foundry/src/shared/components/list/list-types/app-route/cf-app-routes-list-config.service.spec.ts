import { CommonModule, DatePipe } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ConfirmationDialogService,
  CoreModule,
  CurrentUserPermissionsService
} from '@stratosui/core';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock, generateCfStoreModules } from '@test-framework/cf';
import { CFAppState } from '../../../../../cf-app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppRoutesListConfigService } from './cf-app-routes-list-config.service';

describe('CfAppRoutesListConfigService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        CommonModule,
        CoreModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        {
          provide: CfAppRoutesListConfigService,
          useFactory: (
            store: Store<CFAppState>,
            appService: ApplicationService,
            confirmDialog: ConfirmationDialogService,
            datePipe: DatePipe,
            cups: CurrentUserPermissionsService) => {
            return new CfAppRoutesListConfigService(store, appService, confirmDialog, datePipe, cups);
          },
          deps: [Store, ApplicationService, ConfirmationDialogService, DatePipe, CurrentUserPermissionsService]
        },
        DatePipe,
        ...cfCurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppRoutesListConfigService);
    expect(service).toBeTruthy();
  });
});
