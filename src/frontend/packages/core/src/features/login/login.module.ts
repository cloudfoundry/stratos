import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginPageComponent } from './login-page/login-page.component';
import { LoginRoutingModule } from './login.routing';
import { StratosComponentsModule } from '@stratos/shared';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    StratosComponentsModule,
    LoginRoutingModule
  ],
  declarations: [
    LoginPageComponent
  ]
})
export class LoginModule { }
