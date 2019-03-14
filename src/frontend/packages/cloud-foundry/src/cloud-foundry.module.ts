import { NgModule } from '@angular/core';

import { StratosExtension } from '../../core/src/core/extension/extension-service';
import { EndpointTypeConfig } from '../../core/src/core/extension/extension-types';
import { urlValidationExpression } from '../../core/src/core/utils.service';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { CloudFoundryComponentsModule } from './shared/components/components.module';

const cloudFoundryEndpointTypes: EndpointTypeConfig[] = [{
  value: 'cf',
  label: 'Cloud Foundry',
  urlValidation: urlValidationExpression,
  icon: 'cloud_foundry',
  iconFont: 'stratos-icons',
  imagePath: '/core/assets/endpoint-icons/cloudfoundry.png',
  homeLink: (guid) => ['/cloud-foundry', guid],
  listDetailsComponent: CfEndpointDetailsComponent
}];

@StratosExtension({
  endpointTypes: cloudFoundryEndpointTypes,
})
@NgModule({
  imports: [
    CloudFoundryComponentsModule
  ],
})
export class CloudFoundryModule { }
