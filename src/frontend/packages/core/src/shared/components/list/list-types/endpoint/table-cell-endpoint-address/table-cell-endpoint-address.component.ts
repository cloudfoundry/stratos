import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../../../../store/src/actions/endpoint.actions';
import { EntityServiceFactory } from '../../../../../../../../store/src/entity-service-factory.service';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { getFullEndpointApiUrl } from '../../../../../../features/endpoints/endpoint-helpers';
import { TableCellCustom } from '../../../list.types';
import { RowWithEndpointId } from '../table-cell-endpoint-name/table-cell-endpoint-name.component';

@Component({
  selector: 'app-table-cell-endpoint-address',
  templateUrl: './table-cell-endpoint-address.component.html',
  styleUrls: ['./table-cell-endpoint-address.component.scss']
})
export class TableCellEndpointAddressComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {
  public endpointAddress$: Observable<any>;

  constructor(private entityServiceFactory: EntityServiceFactory) {
    super();
  }

  @Input('row')
  set row(row: EndpointModel | RowWithEndpointId) {
    /* tslint:disable-next-line:no-string-literal */
    const id = row['endpointId'] || row['guid'];
    this.endpointAddress$ = this.entityServiceFactory.create(id, new GetAllEndpoints()).waitForEntity$.pipe(
      map(data => data.entity),
      map((data: any) => getFullEndpointApiUrl(data))
    );
  }
}
