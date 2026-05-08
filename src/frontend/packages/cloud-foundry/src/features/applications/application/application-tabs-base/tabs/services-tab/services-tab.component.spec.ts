import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import {ApplicationService, generateCFEntities, ServiceActionHelperService,
  cfCurrentUserPermissionsService} from '@stratosui/cloud-foundry';
import { ApplicationServiceMock, generateActiveRouteCfOrgSpaceMock, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { ServicesTabComponent } from './services-tab.component';

describe('ServicesTabComponent', () => {
  let component: ServicesTabComponent;
  let fixture: ComponentFixture<ServicesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServicesTabComponent,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
        ),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
                ...generateCFEntities()
              ]
            }
          ]
        },
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        generateActiveRouteCfOrgSpaceMock(),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        DatePipe,
        ServiceActionHelperService,
        ...cfCurrentUserPermissionsService,
        Store,
        // The component reads `dataService.serviceBindingsCount` for its
        // bound-services count and calls `refresh('serviceBindings')` on
        // mount. AppDetailDataService is normally provided at the app-
        // detail route component (ApplicationBaseComponent); supply a
        // minimal stub here so the tab's L5 binding resolves without
        // dragging the whole app-detail provider chain into the spec.
        {
          provide: AppDetailDataService,
          useValue: {
            summary: signal(null),
            serviceBindings: signal(null),
            serviceBindingsCount: signal(0),
            refresh: () => Promise.resolve(),
          },
        },
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesTabComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() as the component may subscribe to observables
    // that require more complex test data setup
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
