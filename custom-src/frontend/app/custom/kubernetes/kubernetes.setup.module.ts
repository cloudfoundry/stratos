import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import { CoreModule } from '../../core/core.module';
import { EntityCatalogueModule } from '../../core/entity-catalogue.module';
import { SharedModule } from '../../shared/shared.module';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { generateKubernetesEntities } from './kubernetes-entity-generator';
import { KubernetesStoreModule } from './kubernetes.store.module';

export interface IK8FavMetadata extends IFavoriteMetadata {
  guid: string;
  name: string;
  address: string;
}

@NgModule({
  imports: [
    // TODO: RC Everytime this is imported it's executed. See note & `hack` in `generateKubernetesEntities`
    EntityCatalogueModule.forFeature(generateKubernetesEntities),
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule,
  ],
  declarations: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ],
  entryComponents: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
  ]
})
export class KubernetesSetupModule {
  constructor() {
    const endpointType = 'k8s';
    // TODO: RC
    // favoritesConfigMapper.registerFavoriteConfig<EndpointModel, IK8FavMetadata>(
    //   new FavoriteConfig({
    //     endpointType,
    //     entityType: endpointSchemaKey
    //   },
    //     'Kubernetes',
    //     (endpoint: IK8FavMetadata) => ({
    //       type: endpointType,
    //       routerLink: `/kubernetes/${endpoint.guid}`,
    //       lines: [
    //         ['Address', endpoint.address]
    //       ],
    //       name: endpoint.name,
    //     }),
    //     endpoint => ({
    //       guid: endpoint.guid,
    //       name: endpoint.name,
    //       address: getFullEndpointApiUrl(endpoint),
    //     })
    //   )
    // );
  }



}
