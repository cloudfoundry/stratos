import { Component, Input } from '@angular/core';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CfRoute } from '../../../../../../../../store/src/types/route.types';

@Component({
  selector: 'app-table-cell-route-apps-attached',
  templateUrl: './table-cell-route-apps-attached.component.html',
  styleUrls: ['./table-cell-route-apps-attached.component.scss']
})
export class TableCellRouteAppsAttachedComponent {
  appNames: string;
  @Input('row')
  set row(route: APIResource<CfRoute>) {
    this.appNames = route.entity.apps.map(
      app => app.entity.name
    ).join(', ');
  }
}
