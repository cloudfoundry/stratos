import { Component } from '@angular/core';

import { ListComponent } from '../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { TileComponent } from '../../../../../../../../core/src/shared/components/tile/tile/tile.component';
import { TileGridComponent } from '../../../../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { CF_GUID } from '../../../../../../../../core/src/shared/entity.tokens';
import { CardAppInstancesComponent } from '../../../../../../shared/components/cards/card-app-instances/card-app-instances.component';
import { CardAppStatusComponent } from '../../../../../../shared/components/cards/card-app-status/card-app-status.component';
import { CardAppUsageComponent } from '../../../../../../shared/components/cards/card-app-usage/card-app-usage.component';
import {
  CfAppInstancesConfigService,
} from '../../../../../../shared/components/list/list-types/app-instance/cf-app-instances-config.service';
import { ActiveRouteCfOrgSpace } from '../../../../../cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../../../../cf/services/cloud-foundry-endpoint.service';
import { ApplicationMonitorService } from '../../../../application-monitor.service';

@Component({
  selector: 'app-instances-tab',
  templateUrl: './instances-tab.component.html',
  styleUrls: ['./instances-tab.component.scss'],
  standalone: true,
  imports: [
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    CardAppUsageComponent,
    ListComponent
  ],
  providers: [
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: (cfGuid: string) => ({ cfGuid }),
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
