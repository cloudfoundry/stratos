import { NgModule } from '@angular/core';

import { StratosExtension } from '../../core/extension/extension-service';
import { CoreModule } from '../../core/core.module';
import { monocularEntities, monocularEntityKeys } from './store/helm.entities';
import { EndpointTypeConfig } from '../../core/extension/extension-types';

const helmEndpointTypes: EndpointTypeConfig[] = [{
  value: 'helm',
  label: 'Helm Repository',
  authTypes: [],
  icon: 'kubernetes',
  iconFont: 'stratos-icons',
  homeLink: (guid) => ['/monocular/repos', guid],
  entitySchemaKeys: monocularEntityKeys,
  doesNotSupportConnect: true
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
