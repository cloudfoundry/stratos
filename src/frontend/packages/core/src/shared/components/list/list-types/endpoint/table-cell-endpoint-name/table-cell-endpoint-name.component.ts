import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { entityCatalog, EndpointModel, stratosEntityCatalog } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { EndpointsService } from '../../../../../../core/endpoints.service';
import { TableCellCustom } from '../../../list.types';

export interface RowWithEndpointId {
  endpointId: string;
}

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  styleUrls: ['./table-cell-endpoint-name.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class TableCellEndpointNameComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {

  public endpoint$: Observable<any>;

  @Input('row')
  set row(row: EndpointModel | RowWithEndpointId) {
    super.row = row;
    /* tslint:disable-next-line:no-string-literal */
    const id = (row as any)['endpointId'] || (row as any)['guid'];
    this.endpoint$ = stratosEntityCatalog.endpoint.store.getEntityMonitor(id).entity$.pipe(
      filter(data => !!data),
      map(data => {
        const ep = entityCatalog.getEndpoint(data.cnsi_type, data.sub_type).definition;
        return {
          ...data,
          canShowLink: data.connectionStatus === 'connected' || ep.unConnectable,
          link: EndpointsService.getLinkForEndpoint(data)
        };
      })
    );
  }
}
