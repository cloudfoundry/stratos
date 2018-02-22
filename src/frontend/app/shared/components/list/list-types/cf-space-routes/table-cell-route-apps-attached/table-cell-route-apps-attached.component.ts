import { Component, OnInit, Input } from '@angular/core';
import { CfRoute } from '../../../../../../store/types/route.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { CloudFoundrySpaceService } from '../../../../../../features/cloud-foundry/services/cloud-foundry-space.service';

@Component({
  selector: 'app-table-cell-route-apps-attached',
  templateUrl: './table-cell-route-apps-attached.component.html',
  styleUrls: ['./table-cell-route-apps-attached.component.scss']
})
export class TableCellRouteAppsAttachedComponent implements OnInit {

  appNames: string;
  @Input('row') row: APIResource<CfRoute>;

  constructor(private cfSpaceService: CloudFoundrySpaceService) { }

  ngOnInit() {
    this.appNames = this.row.entity.apps.map(a => a.entity.name).reduce((a, x) => `${x}, ${a}`, '').replace(/,\s*/, '');
  }

}
