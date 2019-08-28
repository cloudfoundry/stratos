import { NgModule } from '@angular/core';

import { StratosExtension } from '../../core/extension/extension-service';
import { CoreModule } from '../../core/core.module';
import { monocularEntities, monocularEntityKeys } from './store/helm.entities';
import { EndpointTypeExtensionConfig } from '../../core/extension/extension-types';

const helmEndpointTypes: EndpointTypeExtensionConfig[] = [{
  type: 'helm',
  label: 'Helm Repository',
  authTypes: [],
  icon: 'helm',
  iconFont: 'stratos-icons',
  imagePath: '/core/assets/custom/helm.svg',
  homeLink: (guid) => ['/monocular/repos', guid],
  entitySchemaKeys: monocularEntityKeys,
  doesNotSupportConnect: true,
  techPreview: true,
}];

@StratosExtension({
  endpointTypes: helmEndpointTypes,
  entities: monocularEntities,
})
@NgModule({
  imports: [
    CoreModule
  ]
})
export class HelmStoreModule { }
