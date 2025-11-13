import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideStore } from '@ngrx/store';
import { of } from 'rxjs';

import { appReducers, PaginationMonitorFactory, EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { ApplicationServiceMock } from '@test-framework/cf';
import {ApplicationService} from '@stratosui/cloud-foundry';
import { ApplicationStateService } from '../../../../../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../../build-tab/application-env-vars.service';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
import { RoutesTabComponent } from './routes-tab.component';
import {
  ListConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService
} from '@stratosui/core';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  beforeEach(() => {
    const mockDataSource = {
      isLoadingPage$: of(false),
      pagination$: of({}),
      filteredRows: [],
      connect: vi.fn().mockReturnValue(of([])),
      disconnect: vi.fn(),
      destroy: vi.fn()
    };

    const mockListConfig = {
      getDataSource: vi.fn().mockReturnValue(mockDataSource),
      getColumns: vi.fn().mockReturnValue([]),
      getSingleActions: vi.fn().mockReturnValue([]),
      getMultiActions: vi.fn().mockReturnValue([]),
      getGlobalActions: vi.fn().mockReturnValue([]),
      getMultiFiltersConfigs: vi.fn().mockReturnValue([]),
      viewType: 'table',
      text: { title: 'Test', filter: '', noEntries: '' },
      enableTextFilter: false
    };

    const mockConfirmationDialog = {
      open: vi.fn()
    };

    const mockCurrentUserPermissions = {
      can: vi.fn().mockReturnValue(of(true))
    };

    const mockCfOrgSpaceDataService = {
      cf: { guid: 'test-cf-guid' },
      org: { guid: 'test-org-guid' },
      space: { guid: 'test-space-guid' }
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        provideStore(appReducers, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: ApplicationStateService, useValue: {} },
        { provide: ApplicationEnvVarsHelper, useValue: {} },
        { provide: ListConfig, useValue: mockListConfig },
        { provide: ConfirmationDialogService, useValue: mockConfirmationDialog },
        { provide: CurrentUserPermissionsService, useValue: mockCurrentUserPermissions },
        { provide: CfOrgSpaceDataService, useValue: mockCfOrgSpaceDataService },
        PaginationMonitorFactory,
        EntityMonitorFactory,
        EntityServiceFactory,
        DatePipe,
      ],
      imports: [
        RoutesTabComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(RoutesTabComponent, {
      remove: {
        providers: [{ provide: ListConfig, useFactory: {} as any, deps: [] }]
      },
      add: {
        providers: [{ provide: ListConfig, useValue: mockListConfig }]
      }
    });

    fixture = TestBed.createComponent(RoutesTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    // Component is created successfully without triggering full initialization
    expect(component).toBeTruthy();
  });
});
