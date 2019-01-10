import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { getEndpointTypes, getFullEndpointApiUrl } from '../../../../../../features/endpoints/endpoint-helpers';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { CardStatus } from '../../../../../shared.types';
import { CardCell } from '../../../list.types';


@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss']
})
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit, OnChanges {

  static columns = 2;

  public status$ = new ReplaySubject<CardStatus>();

  @Input()
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

  public getEndpointUrl(row: EndpointModel) {
    return getFullEndpointApiUrl(row);
  }

  public getRouterPath(row: EndpointModel) {
    const ext = getEndpointTypes().find(ep => ep.value === row.cnsi_type);
    if (ext && ext.homeLink) {
      return ext.homeLink(row.guid);
    }
    return '';
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
