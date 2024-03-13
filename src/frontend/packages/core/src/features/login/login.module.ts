import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginPageComponent } from './login-page/login-page.component';
import { LogoutPageComponent } from './logout-page/logout-page.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule
  ],
  declarations: [
    LoginPageComponent,
    LogoutPageComponent
  ]
})
export class LoginModule { }
