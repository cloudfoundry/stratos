import { ComponentFactoryResolver, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { HomeModule } from '../../../../../core/src/features/home/home.module';
import { SharedModule } from '../../../../../core/src/public-api';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { CardCfRecentAppsComponent } from '../card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { MDAppModule } from './../../../../../core/src/core/md.module';
import { CFHomeCardComponent } from './cfhome-card.component';

@NgModule({
  imports: [
    CoreModule,
    RouterModule,
    MDAppModule,
    SharedModule,
    HomeModule,
  ],
  declarations: [
    CFHomeCardComponent,
    CardCfRecentAppsComponent,
    CompactAppCardComponent,
  ],
  exports: [
    CFHomeCardComponent,
    CardCfRecentAppsComponent,
    CompactAppCardComponent,
  ],
  providers: [
    ApplicationStateService,
  ]
})
export class CFHomeCardModule {

  public createHomeCard(componentFactoryResolver: ComponentFactoryResolver) {
    return componentFactoryResolver.resolveComponentFactory(CFHomeCardComponent);
  }
}
