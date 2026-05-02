import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { testSCFEndpointGuid } from '@stratosui/store/testing';
import { AppApplicationActionsService } from '../../../../../../shared/services/application-actions.service';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from "./view-buildpack/view-buildpack.component";
describe('BuildTabComponent', () => {
  let component: BuildTabComponent;
  let fixture: ComponentFixture<BuildTabComponent>;

  const appId = '4e4858c4-24ab-4caf-87a8-7703d1da58a0';
  const cfId = testSCFEndpointGuid;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BuildTabComponent,
        ViewBuildpackComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
      ],
      providers: [
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        // BuildTab reads actions.inFlight() to drive the status-card pulse
        // animation. The mock exposes a readonly Signal so the template
        // binding {{ actions.inFlight() }} resolves without injecting the
        // real action service (which depends on parent-scoped providers).
        {
          provide: AppApplicationActionsService,
          useValue: { inFlight: signal(false).asReadonly() },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BuildTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
