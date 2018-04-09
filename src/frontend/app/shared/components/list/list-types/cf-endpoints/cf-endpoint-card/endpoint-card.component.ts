import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { CardStatus } from '../../../../application-state/application-state.service';
import { TableCellCustom, CardCell } from '../../../list.types';
import { getFullEndpointApiUrl } from '../../../../../../features/endpoints/endpoint-helpers';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss']
})
export class CfEndpointCardComponent extends CardCell<EndpointModel> implements OnInit, OnChanges {

  static columns = 2;

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
    return getFullEndpointApiUrl(row);
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
