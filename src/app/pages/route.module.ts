// import { Routes, RouterModule } from "@angular/router";
// import { NgModule } from "@angular/core";
// import { ConsoleUaaWizardComponent } from "../components/console-uaa-wizard/console-uaa-wizard.component";
// import { LoginPageComponent } from "./login-page/login-page.component";
// import { DashboardBaseComponent } from "./dashboard-base/dashboard-base.component";
// import { AuthGuardService } from "../guards/auth-guard.service";

// // import { LoginPageComponent } from "./pages/login-page/login-page.component";
// // import { DashboardBaseComponent } from "./pages/dashboard-base/dashboard-base.component";

// // import { AuthGuardService } from "./guards/auth-guard.service";

// // import { ComponentsModule } from "./components/components.module";
// // import { ConsoleUaaWizardComponent } from "./components/console-uaa-wizard/console-uaa-wizard.component";

// // import { MDAppModule } from "./md/md.module";

// const appRoutes: Routes = [
//   { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
//   { path: 'uaa', component: ConsoleUaaWizardComponent },
//   { path: 'login', component: LoginPageComponent },
//   {
//     path: '',
//     component: DashboardBaseComponent,
//     canActivate: [AuthGuardService],
//     loadChildren: 'app/pages/pages.module#PagesModule'
//   }
// ];

// @NgModule({
//   imports: [
//     RouterModule.forRoot(appRoutes),
//     // ComponentsModule,
//     // MDAppModule,
//   ],
//   declarations: [
//     LoginPageComponent,
//     DashboardBaseComponent
//   ],
//   providers: [
//     AuthGuardService
//   ],
//   exports: [RouterModule],
// })
// export class AppRoutingModule { }
