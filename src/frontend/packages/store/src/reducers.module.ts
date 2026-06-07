import { ActionReducerMap } from '@ngrx/store';


// The root ngrx store was removed in the final ngrx-removal closer — nothing
// in the running app injects `Store` any more. `appReducers` (now empty) is
// retained ONLY because component specs still spin up a throwaway test store
// via `StoreModule.forRoot(appReducers)`; it goes when the specs migrate off
// ngrx. The legacy `lists` view-state slice it once held is now owned by the
// signal-native `ListStateStore` (per-list-key localStorage).
export const appReducers: ActionReducerMap<Record<string, unknown>> = {};
