import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginPageComponent } from './login-page/login-page.component';
import { LogoutPageComponent } from './logout-page/logout-page.component';

const loginRoutes: Routes = [
  { path: '', component: LoginPageComponent, },
  { path: 'logout', component: LogoutPageComponent, }
];

@NgModule({
  imports: [
    RouterModule.forChild(loginRoutes),
  ]
})
export class LoginRoutingModule { }
