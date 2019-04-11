import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { CoreModule } from '../../core/core.module';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { FavoriteConfig, favoritesConfigMapper } from '../../shared/components/favorites-meta-card/favorite-config-mapper';
import { SharedModule } from '../../shared/shared.module';
import { IK8FavMetadata } from '../kubernetes/kubernetes.setup.module';
import { HelmStoreModule } from './helm.store.module';
import { HelmEffects } from './store/helm.effects';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    HelmStoreModule,
    EffectsModule.forFeature([
      HelmEffects
    ])
  ]
})
export class HelmSetupModule {
  constructor() {
    const endpointType = 'helm';
    favoritesConfigMapper.registerFavoriteConfig<EndpointModel, IK8FavMetadata>(
      new FavoriteConfig({
        endpointType,
        entityType: endpointSchemaKey
      },
        'Helm',
        (endpoint: IK8FavMetadata) => ({
          type: endpointType,
          routerLink: `/monodular/charts`,
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


