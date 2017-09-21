import { NgModule, ModuleWithProviders } from "@angular/core";

import { AuthGuardService } from "./auth-guard.service";
import { MDAppModule } from "./md.module";
import { RouterModule } from "@angular/router";
import { SideNavService } from "./side-nav/side-nav.service";

@NgModule({
  imports: [
    MDAppModule
  ],
  exports: [
    MDAppModule,
    RouterModule
  ],
  providers: [
    AuthGuardService,
    SideNavService
  ]
})
export class CoreModule { }
