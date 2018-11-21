import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { getFullEndpointApiUrl } from '../../../../../../features/endpoints/endpoint-helpers';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { CardStatus } from '../../../../application-state/application-state.service';
import { CardCell } from '../../../list.types';

export interface EndpointCardConfig {
  linkButton: boolean;
}
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

  @Input('config')
  public config: EndpointCardConfig = { linkButton: false };

  public linkButton: boolean;

  constructor() {
    super();
  }

  ngOnInit() {
    this.linkButton = this.config ? this.config.linkButton : false;
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
    if (row.cnsi_type === 'cf') {
      return ['/cloud-foundry', row.guid];
    }
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
