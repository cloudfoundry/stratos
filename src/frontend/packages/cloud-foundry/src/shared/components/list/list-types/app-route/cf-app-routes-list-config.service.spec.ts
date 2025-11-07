import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';

import { ConfirmationDialogService, SharedModule } from '@stratosui/core';
import { ApplicationServiceMock } from "@test-framework/application-service-helper";
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CFAppState } from '../../../../../cf-app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CurrentUserPermissionsService } from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { CfAppRoutesListConfigService } from "./cf-app-routes-list-config.service";
describe('CfAppRoutesListConfigService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        NoopAnimationsModule,
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
        provideZonelessChangeDetection(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(CfAppRoutesListConfigService);
    expect(service).toBeTruthy();
  });
});
