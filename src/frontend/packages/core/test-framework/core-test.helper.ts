import { HttpModule } from '@angular/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../store/src/reducers.module';
import { AppStoreExtensionsModule } from '../../store/src/store.extensions.module';
import { CoreModule } from '../src/core/core.module';
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
import { createBasicStoreModule } from './store-test-helper';

export function generateBaseTestStoreModules() {
  return [
    CoreTestingModule,
    AppStoreExtensionsModule,
    StoreModule.forRoot(
      appReducers,
      {
        initialState: createBasicStoreModule(), runtimeChecks: { strictStateImmutability: true, strictActionImmutability: true }
      }
    )
  ];
}

export const BaseTestModulesNoShared = [
  ...generateBaseTestStoreModules(),
  RouterTestingModule,
  CoreModule,
  NoopAnimationsModule,
  HttpModule
];
export const BaseTestModules = [...BaseTestModulesNoShared, SharedModule];

export const MetadataCardTestComponents = [MetaCardComponent, MetaCardItemComponent,
  MetaCardKeyComponent, ApplicationStateIconPipe, ApplicationStateIconComponent,
  MetaCardTitleComponent, CardStatusComponent, MetaCardValueComponent, MultilineTitleComponent];
