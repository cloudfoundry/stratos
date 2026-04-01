import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CoreModule } from '@stratosui/core';
import { HomeModule } from '../../../../core/src/features/home/home.module';
import { SharedModule } from '../../../../core/src/public-api';
import { MDAppModule } from './../../../../core/src/core/md.module';
import { KubernetesHomeCardComponent } from './kubernetes-home-card.component';

@NgModule({
  imports: [
    CoreModule,
    RouterModule,
    MDAppModule,
    SharedModule,
    HomeModule,
    KubernetesHomeCardComponent,
  ],
  exports: [
    KubernetesHomeCardComponent,
  ],
})
export class KubernetesHomeCardModule {}
