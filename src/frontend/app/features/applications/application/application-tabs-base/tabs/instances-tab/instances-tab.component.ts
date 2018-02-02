import { Component, OnInit } from '@angular/core';

import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { CfAppInstancesConfigService } from '../../../../../../shared/components/list/list-configs/cf-app-instances-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component';

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
export class InstancesTabComponent implements OnInit {

  constructor(private appMonitor: ApplicationMonitorService) { }

  ngOnInit() {}

}
