import { ComponentFactoryResolver, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { HomeModule } from '../../../../../core/src/features/home/home.module';
import { SharedModule } from '../../../../../core/src/public-api';
import { CloudFoundrySharedModule } from '../../../shared/cf-shared.module';
import { MDAppModule } from './../../../../../core/src/core/md.module';
import { CFHomeCardComponent } from './cfhome-card.component';

@NgModule({
  imports: [
    CoreModule,
    RouterModule,
    MDAppModule,
    SharedModule,
    CloudFoundrySharedModule,
    HomeModule,
  ],
  declarations: [
    CFHomeCardComponent,
  ],
  exports: [
    CFHomeCardComponent,
  ],
})
export class CFHomeCardModule {

  public createHomeCard(componentFactoryResolver: ComponentFactoryResolver) {
    return componentFactoryResolver.resolveComponentFactory(CFHomeCardComponent);
  }
}
