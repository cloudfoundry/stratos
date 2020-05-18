import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';

import { GetAllEndpoints } from '../../../../../../../../store/src/actions/endpoint.actions';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { TableCellCustom } from '../../../list.types';

export interface RowWithEndpointId {
  endpointId: string;
}

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  styleUrls: ['./table-cell-endpoint-name.component.scss']
})
export class TableCellEndpointNameComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {

  public endpoint$: Observable<any>;

  constructor(
    private entityServiceFactory: EntityServiceFactory,

  ) {
    super();
  }

  @Input('row')
  set row(row: EndpointModel | RowWithEndpointId) {
    /* tslint:disable-next-line:no-string-literal */
    const id = row['endpointId'] || row['guid'];
    this.endpoint$ = this.entityServiceFactory.create(
      id,
      new GetAllEndpoints()
    ).waitForEntity$.pipe(
      map(data => data.entity),
      map((data: any) => {
        const ep = entityCatalog.getEndpoint(data.cnsi_type, data.sub_type).definition;
        data.canShowLink = data.connectionStatus === 'connected' || ep.unConnectable;
        data.link = EndpointsService.getLinkForEndpoint(data);
        return data;
      })
    );
  }
}
