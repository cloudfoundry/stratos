import { Component } from '@angular/core';

import {
  CfAppInstancesConfigService,
} from '../../../../../../shared/components/list/list-types/app-instance/cf-app-instances-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';
import { ApplicationMonitorService } from '../../../../application-monitor.service';

@Component({
  selector: 'app-instances-tab',
  templateUrl: './instances-tab.component.html',
  styleUrls: ['./instances-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppInstancesConfigService,
  },
    ApplicationMonitorService
  ]
})
export class InstancesTabComponent {

}
