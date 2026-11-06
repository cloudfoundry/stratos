import { NgModule } from '@angular/core';

// The `createApplication` ngrx feature slice was removed in favour of the
// signal-native CreateAppStateService; this module is retained (empty)
// because several feature/test modules still import it.
@NgModule({
  imports: []
})
export class CloudFoundryReducersModule { }
