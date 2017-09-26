import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginPageComponent } from './login-page/login-page.component';
import { LoginRoutingModule } from './login.routing';


@NgModule({
    imports: [
	CoreModule,
	SharedModule,
	LoginRoutingModule
    ],
    declarations: [
	LoginPageComponent
    ]
})
export class LoginModule { }
