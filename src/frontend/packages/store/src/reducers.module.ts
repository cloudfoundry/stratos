import { NgModule } from '@angular/core';
import { ActionReducerMap, StoreModule } from '@ngrx/store';

import { LocalStorageService } from './helpers/local-storage-service';


// The legacy `lists` view-state reducer was retired: the signal-native
// `ListStateStore` (core, per-list-key localStorage) now owns list view /
// page / sort. No root reducer slices remain; the store survives only as
// vestigial scaffolding pending the final ngrx-removal slices.
export const appReducers: ActionReducerMap<Record<string, unknown>> = {};

@NgModule({
  imports: [
    StoreModule.forRoot(
      appReducers,
      {
        metaReducers: [
          LocalStorageService.storeToLocalStorageSyncReducer
        ],
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: false
        }
      }
    )
  ]
})
export class AppReducersModule { }
