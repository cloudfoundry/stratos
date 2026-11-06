import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateTestApplicationServiceProvider, generateCfStoreModules, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { testSCFEndpointGuid } from '@stratosui/store/testing';
import { AppApplicationActionsService } from '../../../../../../shared/services/application-actions.service';
import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from "./view-buildpack/view-buildpack.component";

function makeDataServiceStub() {
  return {
    // Minimal app-detail so the Summary template's `@if (data.appDetail())`
    // block renders (the scale card + accordion both live inside it).
    appDetail: signal({
      app: { guid: 'app-1', state: 'STARTED', createdAt: null, routes: [] },
      pkg: null,
      process: null,
      droplet: null,
      build: null,
    }).asReadonly(),
    app: signal({ entity: { instances: 1 } }).asReadonly(),
    summary: signal(undefined).asReadonly(),
    stats: signal([]).asReadonly(),
    envVars: signal(undefined).asReadonly(),
    space: signal(undefined).asReadonly(),
    org: signal(undefined).asReadonly(),
    domains: signal([]).asReadonly(),
    loading: signal({ app: false, stats: false, envVars: false, space: false, org: false, domains: false }).asReadonly(),
    errors: signal({ app: null, stats: null, envVars: null, space: null, org: null, domains: null }).asReadonly(),
    running: signal(false).asReadonly(),
    url: signal(null).asReadonly(),
    stratosProject: signal(null).asReadonly(),
    state: signal({ status: 'UNKNOWN' }).asReadonly(),
    fetching: signal(false).asReadonly(),
    lastPolledAt: signal(null).asReadonly(),
    // Reads exercised by the merged-in InstancesAccordionComponent (its
    // tab-scoped services instantiate when the accordion renders, even
    // while collapsed). Mirrors the accordion's own spec data stub.
    statsFetchedAt: signal(null).asReadonly(),
    usageHistory: signal(new Map()).asReadonly(),
    serviceBindingsCount: signal(0).asReadonly(),
    stratosProjectSource: signal(null).asReadonly(),
    raiseFocusPriority: vi.fn(() => vi.fn()),
    setStatsPollMs: vi.fn(),
    cnsiGuid: 'cnsi-1',
    appGuid: 'app-1',
    refresh: () => Promise.resolve(),
  };
}
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
        { provide: AppDetailDataService, useFactory: makeDataServiceStub },
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

  it('renders the instances accordion', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-instances-accordion')).toBeTruthy();
  });

  it('renders the scale card with actions enabled', () => {
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.directive(CardAppInstancesComponent));
    expect(card).toBeTruthy();
    expect(card.componentInstance.showActions).toBe(true);
  });
});
