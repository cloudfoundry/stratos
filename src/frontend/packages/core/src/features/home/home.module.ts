import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreModule, SharedModule } from '@stratosui/core';

import { MDAppModule } from './../../core/md.module';
import { FavoritesMetaCardComponent } from './home/favorites-meta-card/favorites-meta-card.component';
import { HomePageCardDirective } from './home/home-page-card.directive';
import { HomePageEndpointCardComponent } from './home/home-page-endpoint-card/home-page-endpoint-card.component';
import { HomePageComponent } from './home/home-page.component';


@NgModule({
  imports: [
    CoreModule,
    RouterModule,
    MDAppModule,
    SharedModule,
  ],
  declarations: [
    HomePageComponent,
    HomePageCardDirective,
    HomePageEndpointCardComponent,
    FavoritesMetaCardComponent,
  ],
  exports: [
    FavoritesMetaCardComponent,
  ]
})
export class HomeModule { }
