import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { TEST_CATALOGUE_ENTITIES, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { generateHelmEntities } from '../../../helm/helm-entity-generator';
import { MockChartService } from '../../../helm/monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { ConfigService } from '../../../helm/monocular/shared/services/config.service';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleaseVersionsSignalConfigService } from './helm-release-versions-signal-config.service';
import { UpgradeReleaseComponent } from './upgrade-release.component';


describe('UpgradeReleaseComponent', () => {
  let component: UpgradeReleaseComponent;
  let fixture: ComponentFixture<UpgradeReleaseComponent>;
  let mockHelmReleaseHelper: Partial<HelmReleaseHelperService>;

  beforeEach(() => {
    // Mock HelmReleaseHelperService to prevent constructor subscription errors
    mockHelmReleaseHelper = {
      guid: 'test-endpoint:test-namespace:test-release',
      upgrade: vi.fn().mockReturnValue(signal(null)),
      // undefined: no release has resolved yet
      release: signal(undefined),
      releaseTitle: 'test-release',
      endpointGuid: 'test-endpoint',
      namespace: 'test-namespace'
    };

    TestBed.configureTestingModule({
      imports: [
        UpgradeReleaseComponent,
        EntityCatalogTestModule,
      ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: HTTP_INTERCEPTORS,
          useValue: [],
          multi: true
        },
        EntityCatalogHelper,
        { provide: HelmReleaseHelperService, useValue: mockHelmReleaseHelper },
        TabNavService,
        KubernetesEndpointService,
        { provide: BaseKubeGuid, useValue: { guid: 'anything' } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { guid: 'test-endpoint:test-namespace:test-release' },
              queryParams: {}
            }
          }
        },
        { provide: ChartsService, useValue: new MockChartService() },
        { provide: ConfigService, useValue: { appName: 'appName' } },
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...kubeEntityCatalog.allKubeEntities(),
            ...generateHelmEntities(),
          ]
        }
      ]
    });

    // The component provides its own HelmReleaseHelperService; swap that one too.
    TestBed.overrideProvider(HelmReleaseHelperService, { useValue: mockHelmReleaseHelper });

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(UpgradeReleaseComponent);
    component = fixture.componentInstance;
    // The template is not rendered: it needs the stepper and list data. These
    // tests exercise the component class, so they flush effects with TestBed.tick().
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The version-step handle is valid only once a row is selected. With no
  // upgrade target resolved (upgrade → null here) nothing is loaded or
  // auto-selected, so the step starts invalid.
  it('version step starts invalid until a version is selected', () => {
    expect(component.versionStepHandle.valid()).toBe(false);
  });

  it('sets up the version list once the upgrade target resolves', () => {
    // Loading the versions is HTTP; this test is about when the list is set up.
    const loadAll = vi.spyOn(HelmReleaseVersionsSignalConfigService.prototype, 'loadAll').mockResolvedValue(undefined);
    const chart = signal<any>(null);
    (mockHelmReleaseHelper.upgrade as any).mockReturnValue(chart);
    const live = TestBed.createComponent(UpgradeReleaseComponent);
    TestBed.tick();
    expect(live.componentInstance.listConfig()).toBeUndefined();

    chart.set({
      upgrade: { name: 'chart', repo: { name: 'repo' } },
      release: { chart: { metadata: { version: '1.0.0' } } },
      monocularEndpointId: 'monocular',
    });
    TestBed.tick();

    expect(live.componentInstance.listConfig()).toBeDefined();
    expect(loadAll).toHaveBeenCalledTimes(1);
  });

  // The upgrade target can resolve after the user has left the page. The
  // late value must not set up a version list on the destroyed component.
  it('ignores an upgrade target that resolves after destroy', () => {
    const chart = signal<any>(null);
    (mockHelmReleaseHelper.upgrade as any).mockReturnValue(chart);
    const late = TestBed.createComponent(UpgradeReleaseComponent);
    late.destroy();

    chart.set({
      upgrade: { name: 'chart', repo: { name: 'repo' } },
      release: { chart: { metadata: { version: '1.0.0' } } },
      monocularEndpointId: 'monocular',
    });
    TestBed.tick();

    expect(late.componentInstance.listConfig()).toBeUndefined();
  });
});
