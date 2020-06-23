import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { EntityCatalogHelper } from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog.service';
import { EntityCatalogHelpers } from '../../store/src/entity-catalog/entity-catalog.helper';
import { appReducers } from '../../store/src/reducers.module';
import { CoreModule } from '../src/core/core.module';
import { CurrentUserPermissionsService } from '../src/core/permissions/current-user-permissions.service';
import {
  ApplicationStateIconComponent,
} from '../src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { CardStatusComponent } from '../src/shared/components/cards/card-status/card-status.component';
import { MetaCardComponent } from '../src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import {
  MetaCardItemComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import {
  MetaCardKeyComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import {
  MetaCardTitleComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import {
  MetaCardValueComponent,
} from '../src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from '../src/shared/components/multiline-title/multiline-title.component';
import { SharedModule } from '../src/shared/shared.module';
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
    StoreModule.forRoot(
      appReducers,
      {
        initialState: createBasicStoreModule(), runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
      }
    ),
    AppTestModule
  ];
}

export const BaseTestModulesNoShared = [
  ...generateBaseTestStoreModules(),
  RouterTestingModule,
  CoreModule,
  NoopAnimationsModule,
  HttpClientModule
];
export const BaseTestModules = [...BaseTestModulesNoShared, SharedModule];

export const MetadataCardTestComponents = [MetaCardComponent, MetaCardItemComponent,
  MetaCardKeyComponent, ApplicationStateIconPipe, ApplicationStateIconComponent,
  MetaCardTitleComponent, CardStatusComponent, MetaCardValueComponent, MultilineTitleComponent];
