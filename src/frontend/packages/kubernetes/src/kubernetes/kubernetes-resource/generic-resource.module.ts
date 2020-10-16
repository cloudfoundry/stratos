import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CoreModule } from '@angular/flex-layout';

import { SharedModule } from '../../../../core/src/public-api';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesResourceRoutingModule } from './generic-resource.routing';
import { KubernetesResourceListComponent } from './kubernetes-resource-list/kubernetes-resource-list.component';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesResourceRoutingModule,
  ],
  declarations: [
    KubernetesResourceListComponent,
  ],
  providers: [
    KubernetesService,
    BaseKubeGuid,
    KubernetesEndpointService,
  ],
  exports: [
    KubernetesResourceListComponent,
  ]
})
export class KubernetesGenericResourceModule { }

