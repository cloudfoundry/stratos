import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { CF_GUID } from '../../../../../../../../core/src/shared/entity.tokens';
import {
  CfAppInstancesConfigService,
} from '../../../../../../shared/components/list/list-types/app-instance/cf-app-instances-config.service';
import { ApplicationMonitorService } from '../../../../../../shared/services/application-monitor.service';
import { ActiveRouteCfOrgSpace } from '../../../../../cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../cf/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-instances-tab',
  templateUrl: './instances-tab.component.html',
  styleUrls: ['./instances-tab.component.scss'],
  providers: [
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: (cfGuid) => ({ cfGuid }),
      deps: [CF_GUID]
    },
    CloudFoundryEndpointService,
    {
      provide: ListConfig,
      useClass: CfAppInstancesConfigService,
    },
    ApplicationMonitorService,
  ]
})
export class InstancesTabComponent {

}
