import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { generateBaseTestStoreModules } from '../../../core/test-framework/core-test.helper';
import { CoreModule } from '../../../core/src/core/core.module';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { TabNavService } from '../../../core/src/tab-nav.service';
import {
  CATALOGUE_ENTITIES,
  entityCatalog,
  EntityCatalogFeatureModule,
  EntityCatalogProvidersModule,
  type TestEntityCatalog,
} from '@stratosui/store';
import { generateStratosEntities } from '../../../store/src/stratos-entity-generator';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { HelmReleaseActivatedRouteMock, HelmReleaseGuidMock } from '../helm/helm-testing.module';
import { kubeEntityCatalog } from './kubernetes-entity-generator';
import { BaseKubeGuid } from './kubernetes-page.types';
import { HelmReleaseHelperService } from './workloads/release/tabs/helm-release-helper.service';

@NgModule({
  imports: [
    EntityCatalogFeatureModule,
    EntityCatalogProvidersModule
  ],
  providers: [
    ...STORE_TEST_PROVIDERS,
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => {
        const testEntityCatalog = entityCatalog as TestEntityCatalog;
        testEntityCatalog.clear();
        return [
          ...generateStratosEntities(),
          ...kubeEntityCatalog.allKubeEntities(),
        ];
      },
      multi: true
    }
  ]
})
export class KubernetesTestingModule { }

/**
 * Generate Kubernetes store modules for testing
 * Use this in test imports to get proper test module configuration
 *
 * Note: This includes Core, NoopAnimations, and Shared modules to match BaseTestModules pattern
 */
export function generateKubeStoreModules() {
  const base = generateBaseTestStoreModules();
  const modules = [
    ...base,
    CoreModule,
    NoopAnimationsModule,
    SharedModule,
    KubernetesTestingModule,
  ];

  // Debug: check for undefined modules
  modules.forEach((m, i) => {
    if (m === undefined || m === null) {
      console.error(`Module at index ${i} is ${m}`);
    }
  });

  return modules;
}

export const KubernetesBaseTestModules = generateKubeStoreModules();

export const HelmReleaseProviders = [
  HelmReleaseHelperService,
  HelmReleaseActivatedRouteMock,
  HelmReleaseGuidMock,
  TabNavService
];

export const KubeBaseGuidMock = { provide: BaseKubeGuid, useValue: { guid: 'anything' } };
