import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { HomePageComponent } from './home/home-page.component';
import { CardAppComponent } from '../../shared/components/list/list-types/app/card/card-app.component';


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
