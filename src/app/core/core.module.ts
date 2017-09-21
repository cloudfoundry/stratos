import { NgModule, ModuleWithProviders } from "@angular/core";

import { AuthGuardService } from "./auth-guard.service";
import { MDAppModule } from "./md.module";
import { RouterModule } from "@angular/router";

@NgModule({
  imports: [
    MDAppModule
  ],
  exports: [
    MDAppModule,
    RouterModule
  ],
  providers: [
    AuthGuardService
  ]
})
export class CoreModule { }
