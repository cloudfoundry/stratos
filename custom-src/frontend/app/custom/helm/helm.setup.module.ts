import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { EffectsModule } from '@ngrx/effects';
import { HelmStoreModule } from './helm.store.module';
import { HelmEffects } from './store/helm.effects';
import { favoritesConfigMapper, FavoriteConfig } from '../../shared/components/favorites-meta-card/favorite-config-mapper';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { IK8FavMetadata } from '../kubernetes/kubernetes.setup.module';
import { endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    HelmStoreModule,
    EffectsModule.forFeature([
      HelmEffects
    ])
  ],
  declarations: [
  ],
  entryComponents: [
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
          // routerLink: `/monodular/${endpoint.guid}`,
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


