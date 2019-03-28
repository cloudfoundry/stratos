import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';

import { GetAllEndpoints } from '../../../../../../../../store/src/actions/endpoint.actions';
import { endpointSchemaKey, entityFactory } from '../../../../../../../../store/src/helpers/entity-factory';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';
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

  constructor(private entityServiceFactory: EntityServiceFactory) {
    super();
  }

  @Input('row')
  set row(row: EndpointModel | RowWithEndpointId) {
    /* tslint:disable-next-line:no-string-literal */
    const id = row['endpointId'] || row['guid'];
    this.endpoint$ = this.entityServiceFactory.create(
      endpointSchemaKey,
      entityFactory(endpointSchemaKey),
      id,
      new GetAllEndpoints(),
      false
    ).waitForEntity$.pipe(
      map(data => data.entity),
      map((data: any) => {
        const ep = getEndpointType(data.cnsi_type, data.sub_type);
        data.canShowLink = data.connectionStatus === 'connected' || ep.doesNotSupportConnect;
        data.link = EndpointsService.getLinkForEndpoint(data);
        return data;
      })
    );
  }
}
