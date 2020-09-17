import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { HomePageComponent } from './home/home-page.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
  ],
  declarations: [
    HomePageComponent
  ]
})
export class HomeModule { }
