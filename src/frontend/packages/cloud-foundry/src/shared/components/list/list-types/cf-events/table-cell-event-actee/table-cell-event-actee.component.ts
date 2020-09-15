import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-event-actee',
  templateUrl: './table-cell-event-actee.component.html',
  styleUrls: ['./table-cell-event-actee.component.scss']
})
export class TableCellEventActeeComponent extends TableCellCustom<APIResource> {

  icon: {
    [type: string]: {
      icon: string,
      iconFont?: string
    }
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

  @Input() config: {
    setActeeFilter: (actee: string) => void;
  };

  // constructor() { }

  // ngOnInit() {
  // }

  setActee() {
    this.config.setActeeFilter(this.row.entity.actee);
  }

}
