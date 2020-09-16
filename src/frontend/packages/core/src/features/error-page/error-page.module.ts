import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ErrorPageRoutingModule } from './error-page.routing';
import { ErrorPageComponent } from './error-page/error-page.component';

@NgModule({
  declarations: [ErrorPageComponent],
  imports: [
    CoreModule,
    SharedModule,
    ErrorPageRoutingModule
  ]
})
export class ErrorPageModule { }
