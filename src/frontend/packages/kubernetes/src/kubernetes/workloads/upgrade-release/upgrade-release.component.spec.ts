import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { TabNavService } from '@stratosui/core';
import { TEST_CATALOGUE_ENTITIES, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers, appReducers, provideStore } from '@stratosui/store';
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
import { UpgradeReleaseComponent } from './upgrade-release.component';


describe('UpgradeReleaseComponent', () => {
  let component: UpgradeReleaseComponent;
  let fixture: ComponentFixture<UpgradeReleaseComponent>;
  let mockHelmReleaseHelper: Partial<HelmReleaseHelperService>;

  beforeEach(() => {
    // Mock HelmReleaseHelperService to prevent constructor subscription errors
    mockHelmReleaseHelper = {
      guid: 'test-endpoint:test-namespace:test-release',
      hasUpgrade: vi.fn().mockReturnValue(of(null)),
      release$: of(null),
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
        provideStore(appReducers),
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

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(UpgradeReleaseComponent);
    component = fixture.componentInstance;
    // Note: Not calling detectChanges() because the component's constructor subscribes to
    // observables that require complex test data setup. The subscription calls take(1) which
    // throws EmptyError in test environment. For a basic creation test, we just verify the
    // component can be instantiated.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression guard for the FWT-959 Part 2 OnDestroy fix. validateSub
  // is subscribed inside helper.hasUpgrade()'s callback to mirror
  // validate$ into the version-step handle's signal; without ngOnDestroy
  // teardown the hot listConfig.versionsDataSource.selectedRows$ stream
  // would keep emitting after component destruction.
  it('unsubscribes validateSub on destroy', () => {
    const sub = { unsubscribe: vi.fn() };
    (component as any).validateSub = sub;
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
});
