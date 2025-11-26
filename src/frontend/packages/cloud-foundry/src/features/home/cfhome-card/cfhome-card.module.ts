import { type ComponentFactory, type ComponentFactoryResolver, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CoreModule, SharedModule, MDAppModule } from '@stratosui/core';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationDeploySourceTypes } from '../../applications/deploy-application/deploy-application-steps.types';
import { CardCfRecentAppsComponent } from '../card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CFHomeCardComponent } from './cfhome-card.component';

@NgModule({
  imports: [
    CoreModule,
    RouterModule,
    MDAppModule,
    SharedModule,
    // Standalone components
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
    ApplicationDeploySourceTypes,
  ]
})
export class CFHomeCardModule {
  // Kept for backward compatibility with entity generator
  // In Angular 20+, this method is deprecated but still functional
  public createHomeCard(componentFactoryResolver: ComponentFactoryResolver): ComponentFactory<CFHomeCardComponent> {
    return componentFactoryResolver.resolveComponentFactory(CFHomeCardComponent);
  }
}
