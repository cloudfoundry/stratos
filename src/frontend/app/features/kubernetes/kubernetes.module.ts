import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KubernetesComponent } from './kubernetes/kubernetes.component';
import { KubernetesRoutingModule } from './kubernetes.routing';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,    
    KubernetesRoutingModule,

  ],
  declarations: [KubernetesComponent]
})
export class KubernetesModule { }
