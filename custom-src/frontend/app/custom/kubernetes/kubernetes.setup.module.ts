import { favoritesConfigMapper, FavoriteConfig } from './../../shared/components/favorites-meta-card/favorite-config-mapper';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { KubernetesCertsAuthFormComponent } from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import { KubernetesConfigAuthFormComponent } from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { EffectsModule } from '@ngrx/effects';
import { KubernetesEffects } from './store/kubernetes.effects';
import { KubernetesStoreModule } from './kubernetes.store.module';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { IEndpointFavMetadata, IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import { endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';

export interface IK8FavMetadata extends IFavoriteMetadata {
  guid: string;
  name: string;
  address: string;
}

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule,
    EffectsModule.forFeature([
      KubernetesEffects
    ])
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
    favoritesConfigMapper.registerFavoriteConfig<EndpointModel, IK8FavMetadata>(
      new FavoriteConfig({
        endpointType,
        entityType: endpointSchemaKey
      },
        'Kubernetes',
        (endpoint: IK8FavMetadata) => ({
          type: endpointType,
          routerLink: `/kubernetes/${endpoint.guid}`,
          lines: [
            ['Address', endpoint.address]
          ],
          name: endpoint.name,
        }),
        endpoint => ({
          guid: endpoint.guid,
          name: endpoint.name,
          address: getFullEndpointApiUrl(endpoint),
        })
      )
    );
  }



}
