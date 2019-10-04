import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { HelmEffects } from './store/helm.effects';

// const helmEndpointTypes: EndpointTypeExtensionConfig[] = [{
//   type: 'helm',
//   label: 'Helm Repository',
//   authTypes: [],
//   icon: 'helm',
//   iconFont: 'stratos-icons',
//   imagePath: '/core/assets/custom/helm.svg',
//   homeLink: (guid) => ['/monocular/repos', guid],
//   entitySchemaKeys: monocularEntityKeys,
//   doesNotSupportConnect: true,
//   techPreview: true,
// }];

@NgModule({
  imports: [
    EffectsModule.forFeature([
      HelmEffects
    ])
  ]
})
export class HelmStoreModule { }
