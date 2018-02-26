import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KubernetesComponent } from './kubernetes/kubernetes.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [KubernetesComponent]
})
export class KubernetesModule { }
