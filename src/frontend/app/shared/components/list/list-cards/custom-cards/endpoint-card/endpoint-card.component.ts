import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { CardStatus } from '../../../../application-state/application-state.service';
import { TableCellCustom, CardSize } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss']
})
export class EndpointCardComponent extends TableCellCustom<EndpointModel> implements OnInit, OnChanges {

  public size = CardSize.LARGE;
  private status$ = new ReplaySubject<CardStatus>();

  @Input('row')
  row: EndpointModel;

  constructor() {
    super();
  }

  ngOnInit() {
    this.status$.next(this.mapStatus(this.row));
  }

  ngOnChanges(changes: SimpleChanges) {
    const row = changes['row'].currentValue;
    this.status$.next(this.mapStatus(row));
  }

  private getEndpointUrl(row: EndpointModel) {
    return row.api_endpoint ? `${row.api_endpoint.Scheme}://${row.api_endpoint.Host}` : 'Unknown';
  }


  private mapStatus(endpoint: EndpointModel) {
    const connectionStatus = endpoint ? endpoint.connectionStatus : '';
    switch (connectionStatus) {
      case 'connected':
        return CardStatus.OK;
      case 'disconnected':
        return CardStatus.INCOMPLETE;
      default:
        return CardStatus.TENTATIVE;
    }
  }

}
