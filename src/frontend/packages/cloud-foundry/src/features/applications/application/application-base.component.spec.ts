import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
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

describe('ApplicationBaseComponent', () => {
  let component: ApplicationBaseComponent;
  let fixture: ComponentFixture<ApplicationBaseComponent>;

  beforeEach(async () => {
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
        // AppDetailDataService (now provided in ApplicationBaseComponent) injects
        // AppApplicationActionsService; stub it so the component-spec stays
        // lightweight (full integration wired in E2E).
        {
          provide: AppApplicationActionsService,
          useValue: { inFlight: signal(false) },
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
