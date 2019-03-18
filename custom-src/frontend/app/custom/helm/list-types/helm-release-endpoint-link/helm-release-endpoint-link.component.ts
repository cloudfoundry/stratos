import { TableCellEndpointNameComponent } from './../../../../shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import { Component, OnInit } from '@angular/core';
import { getEndpointTypes, getEndpointType } from '../../../../features/endpoints/endpoint-helpers';

@Component({
  selector: 'app-helm-release-endpoint-link',
  templateUrl: './../../../../shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component.html',
  styleUrls: ['./../../../../shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component.scss']
})
export class HelmReleaseEndpointLinkComponent<T> extends TableCellEndpointNameComponent<T> implements OnInit {

  public canShowLink = false;

  getLinkForEndpoint(row) {
    return '';
ß  }

  ngOnInit() {
    console.log(this.row);
    //const ep = getEndpointType((this.row as any).cnsi_type);
    //this.canShowLink = (this.row as any).connectionStatus === 'connected' || ep.doesNotSupportConnect;
    this.canShowLink = false;
  }

}
