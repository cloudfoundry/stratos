import { NgModule } from '@angular/core';

import { StratosExtension } from '../../core/src/core/extension/extension-service';
import { EndpointTypeExtensionConfig } from '../../core/src/core/extension/extension-types';
import { urlValidationExpression } from '../../core/src/core/utils.service';
import { EndpointAuthTypeNames } from '../../core/src/features/endpoints/endpoint-helpers';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { CloudFoundryComponentsModule } from './shared/components/components.module';


export const cloudFoundryEndpointTypes: EndpointTypeExtensionConfig[] = [{
  type: 'cf',
  label: 'Cloud Foundry',
  urlValidation: urlValidationExpression,
  icon: 'cloud_foundry',
  iconFont: 'stratos-icons',
  imagePath: '/core/assets/endpoint-icons/cloudfoundry.png',
  homeLink: (guid) => ['/cloud-foundry', guid],
  listDetailsComponent: CfEndpointDetailsComponent,
  order: 0,
  authTypes: [EndpointAuthTypeNames.CREDS, EndpointAuthTypeNames.SSO]
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
