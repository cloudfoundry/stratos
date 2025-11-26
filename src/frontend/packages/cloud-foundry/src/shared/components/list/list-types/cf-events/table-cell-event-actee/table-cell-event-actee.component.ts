
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomTooltipDirective, CustomIconComponent, TableCellCustom } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { CfEvent } from '../../../../../../cf-api.types';

interface CellEVentActeeConfig {
  setActeeFilter: (actee: string) => void;
}

@Component({
  selector: 'app-table-cell-event-actee',
  templateUrl: './table-cell-event-actee.component.html',
  styleUrls: ['./table-cell-event-actee.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CustomIconComponent,
    CustomTooltipDirective
]
})
export class TableCellEventActeeComponent extends TableCellCustom<APIResource<CfEvent>, CellEVentActeeConfig> {

  icon: {
    [type: string]: {
      icon: string,
      iconFont?: string;
    };
  } = {
      '': {
        icon: 'help'
      },
      app: {
        icon: 'apps',
      },
      route: {
        icon: 'route',
        iconFont: 'stratos-icons'
      },
      service: {
        icon: 'service',
        iconFont: 'stratos-icons'
      },
      service_binding: {
        icon: 'compare_arrows'
      },
      service_broker: {
        icon: 'smt',
        iconFont: 'stratos-icons'
      },
      service_dashboard_client: {
        icon: 'dashboard',
      },
      service_instance: {
        icon: 'service-instance',
        iconFont: 'stratos-icons'
      },
      service_key: {
        icon: 'vpn_key',
      },
      service_plan: {
        icon: 'service-plan',
        iconFont: 'stratos-icons'
      },
      service_plan_visibility: {
        icon: 'remove_red_eye',
      },
      space: {
        icon: 'virtual_space',
        iconFont: 'stratos-icons'
      },
      organization: {
        icon: 'organization',
        iconFont: 'stratos-icons'
      },
      user: {
        icon: 'people',
      },
      user_provided_service_instance: {
        icon: 'service_square',
        iconFont: 'stratos-icons'
      },
    };

  setActee() {
    this.config.setActeeFilter(this.row.entity.actee);
  }

}
