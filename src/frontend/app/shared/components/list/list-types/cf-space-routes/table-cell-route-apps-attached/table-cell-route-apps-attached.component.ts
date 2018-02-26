import { Component, OnInit, Input } from '@angular/core';
import { CfRoute } from '../../../../../../store/types/route.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { CloudFoundrySpaceService } from '../../../../../../features/cloud-foundry/services/cloud-foundry-space.service';

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
