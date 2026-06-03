import { NgModule } from '@angular/core';
import { ActionReducerMap, StoreModule } from '@ngrx/store';

import { LocalStorageService } from './helpers/local-storage-service';
import { listReducer } from './reducers/list.reducer';


// NOTE: Revisit when ngrx-store-logger supports Angular 7 (https://github.com/btroncone/ngrx-store-logger)

// import { storeLogger } from 'ngrx-store-logger';

// https://github.com/btroncone/ngrx-store-logger/issues/34
// export function logger(reducer) {
//   // default, no options
//   return storeLogger()(reducer);
// }

export const appReducers: ActionReducerMap<Record<string, unknown>> = {
  lists: listReducer,
};

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
