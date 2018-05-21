import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { CustomModule } from '../../custom.module';
import { SharedModule } from '../../shared/shared.module';
import { AboutPageComponent } from './about-page/about-page.component';
import { AboutRoutingModule } from './about.routing';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AboutRoutingModule,
    CustomModule
  ],
  declarations: [
    AboutPageComponent
  ]
})
export class AboutModule { }
