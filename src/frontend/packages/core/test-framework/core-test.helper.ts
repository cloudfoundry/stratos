import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EntityCatalogHelper, EntityCatalogHelpers, appReducers } from '@stratosui/store';
import {
  createBasicStoreModule,
  createEmptyStoreModule,
  createEntityStore,
  createEntityStoreState,
  populateStoreWithTestEndpoint,
  StoreTestingModule,
  STORE_TEST_PROVIDERS
} from '@stratosui/store/testing';

// Use relative imports to avoid circular dependency issues with barrel exports
import { CurrentUserPermissionsService } from '../src/core/permissions/current-user-permissions.service';
import { CoreModule } from '../src/core/core.module';
import { SharedModule } from '../src/shared/shared.module';
import { ApplicationStateIconComponent } from '../src/shared/components/application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { CardStatusComponent } from '../src/shared/components/cards/card-status/card-status.component';
import { MetaCardComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from '../src/shared/components/multiline-title/multiline-title.component';
import { CoreTestingModule } from './core-test.modules';

@NgModule({
  imports: [CoreModule],
  providers: [
    CurrentUserPermissionsService
  ]
})
export class AppTestModule {
  constructor(
    ech: EntityCatalogHelper
  ) {
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  }
}

export function generateBaseTestStoreModules() {
  return [
    CoreTestingModule,
    createBasicStoreModule(),
    AppTestModule
  ].filter(m => m !== undefined && m !== null);
}

export const BaseTestModulesNoShared = [
  ...generateBaseTestStoreModules(),
  CoreModule,
  NoopAnimationsModule,
];
export const BaseTestModules = [...BaseTestModulesNoShared, SharedModule];

// Base test providers for router and HTTP (replacing deprecated RouterTestingModule and HttpClientModule)
export const BASE_TEST_PROVIDERS = [
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(), // Prevents real HTTP connections in tests
];

export const MetadataCardTestComponents = [MetaCardComponent, MetaCardItemComponent,
  MetaCardKeyComponent, ApplicationStateIconPipe, ApplicationStateIconComponent,
  MetaCardTitleComponent, CardStatusComponent, MetaCardValueComponent, MultilineTitleComponent];

// Re-export store testing utilities so they're available from @test-framework
// This is needed because index.ts does export * from core-test.helper
export {
  createBasicStoreModule,
  createEmptyStoreModule,
  createEntityStore,
  createEntityStoreState,
  populateStoreWithTestEndpoint,
  StoreTestingModule,
  STORE_TEST_PROVIDERS,
  type TestStoreEntity,
  testSCFEndpoint,
  testSCFEndpointGuid,
  testSessionData
} from '@stratosui/store/testing';
