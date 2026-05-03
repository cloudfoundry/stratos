import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '@stratosui/store';
import { ApplicationBaseComponent } from './application-base.component';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from "./application-tabs-base/tabs/build-tab/application-env-vars.service";
import { AppApplicationActionsService } from '../../../shared/services/application-actions.service';
import { AppDeleteSelectionService } from '../app-delete-selection.service';
import { AppDetailDataService } from '../app-detail-data.service';

describe('ApplicationBaseComponent', () => {
  let component: ApplicationBaseComponent;
  let fixture: ComponentFixture<ApplicationBaseComponent>;

  beforeEach(async () => {
    // Component-level providers in ApplicationBaseComponent take precedence
    // over testbed providers (Angular DI rule). Override the component to
    // strip out the heavy AppApplicationActionsService + AppDetailDataService
    // chain so we can stub them at testbed scope. The stripped pieces are
    // exercised in their own per-service specs.
    TestBed.overrideComponent(ApplicationBaseComponent, {
      set: {
        providers: [
          { provide: CF_GUID, useValue: 'test-cf' },
          { provide: APP_GUID, useValue: 'test-app' },
        ],
      },
    });
    await TestBed.configureTestingModule({
      imports: [
        ApplicationBaseComponent,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(), // captures initialize() HTTP calls so they don't error
        provideNoopAnimations(),
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: {
              strictStateImmutability: false,
              strictActionImmutability: false
            }
          })
        ),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        // Component overrides above strip the real providers; stub the
        // collaborators so the spec exercises only the component's own
        // wiring (per-service specs cover the stubbed pieces directly).
        {
          provide: AppApplicationActionsService,
          useValue: {
            inFlight: signal(false),
            deleteWithCleanup: () => Promise.resolve(),
          },
        },
        {
          provide: AppDeleteSelectionService,
          useValue: {
            requested: signal(false).asReadonly(),
            routes: signal([]).asReadonly(),
            bindings: signal([]).asReadonly(),
            clear: () => undefined,
            setPending: () => undefined,
          },
        },
        {
          provide: AppDetailDataService,
          useValue: { initialize: () => undefined },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                id: 'test-app-id',
                endpointId: 'test-endpoint-id'
              }
            },
            params: of({
              id: 'test-app-id',
              endpointId: 'test-endpoint-id'
            })
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
