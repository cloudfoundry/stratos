import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreModule, SharedModule } from '@stratosui/core';

import { MDAppModule } from './../../core/md.module';
import {
  DefaultEndpointHomeComponent,
} from './home/default-endpoint-home-component/default-endpoint-home-component.component';
import { FavoritesMetaCardComponent } from './home/favorites-meta-card/favorites-meta-card.component';
import { FavoritesSidePanelComponent } from './home/favorites-side-panel/favorites-side-panel.component';
import { HomePageEndpointCardComponent } from './home/home-page-endpoint-card/home-page-endpoint-card.component';
import { HomePageComponent } from './home/home-page.component';
import { HomeShortcutsComponent } from './home/home-shortcuts/home-shortcuts.component';

@NgModule({
  imports: [
    CoreModule,
    RouterModule,
    MDAppModule,
    SharedModule,
  ],
  declarations: [
    HomePageComponent,
    HomePageEndpointCardComponent,
    FavoritesMetaCardComponent,
    HomeShortcutsComponent,
    FavoritesSidePanelComponent,
    DefaultEndpointHomeComponent,
  ],
  exports: [
    FavoritesMetaCardComponent,
    HomeShortcutsComponent,
  ]
})
export class HomeModule { }
