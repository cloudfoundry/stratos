import { Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { getFavoriteFromEndpointEntity } from '../../../../../../core/user-favorite-helpers';
import {
  EndpointIcon,
  endpointListDetailsComponents,
  getEndpointType,
  getFullEndpointApiUrl,
  getIconForEndpoint,
  getNameForEndpointType,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { CardStatus } from '../../../../../shared.types';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { CfEndpointDetailsComponent } from '../cf-endpoint-details/cf-endpoint-details.component';
import { EndpointListHelper } from '../endpoint-list.helpers';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss'],
  entryComponents: [...endpointListDetailsComponents]
})
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit {

  public status$ = new ReplaySubject<CardStatus>();
  public rowObs = new ReplaySubject<EndpointModel>();
  public favorite: UserFavoriteEndpoint;
  public type: string;
  public address: string;
  public cardMenu: MetaCardMenuItem[];
  public icon: EndpointIcon;
  public hasDetails = true;

  @Input() component: CfEndpointDetailsComponent;
  private endpointDetails: ViewContainerRef;
  @ViewChild('endpointDetails', { read: ViewContainerRef }) set content(content: ViewContainerRef) {
    this.endpointDetails = content;
    this.updateDetails();
  }

  private pRow: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    this.pRow = row;
    this.type = row ? getNameForEndpointType(row.cnsi_type) : '';
    this.icon = row ? getIconForEndpoint(row.cnsi_type) : null;
    this.address = row ? getFullEndpointApiUrl(row) : '';
    this.status$.next(this.determineEndpointStatus(row));
    this.rowObs.next(row);
    this.updateDetails();
  }
  get row(): EndpointModel {
    return this.pRow;
  }

  constructor(
    endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    super();
    this.cardMenu = endpointListHelper.endpointActions().map(endpointAction => ({
      label: endpointAction.label,
      action: () => endpointAction.action(this.pRow),
      can: endpointAction.createVisible(this.rowObs)
    }));
  }

  ngOnInit() {
    this.favorite = getFavoriteFromEndpointEntity(this.row);
    const e = getEndpointType(this.pRow.cnsi_type);
    this.hasDetails = !!e.listDetailsComponent;
  }

  getLinkForEndpoint() {
    return EndpointsService.getLinkForEndpoint(this.row);
  }

  determineEndpointStatus(row: EndpointModel): CardStatus {
    switch (row.connectionStatus) {
      case 'connected':
        return CardStatus.OK;
      case 'disconnected':
        return CardStatus.TENTATIVE;
      case 'checking':
        return CardStatus.BUSY;
      default:
        return CardStatus.INCOMPLETE;
    }
  }

  updateDetails() {
    if (!this.endpointDetails) {
      return;
    }
    const e = getEndpointType(this.pRow.cnsi_type);
    if (!e.listDetailsComponent) {
      return;
    }

    if (!this.component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(e.listDetailsComponent);
      const componentRef = this.endpointDetails.createComponent(componentFactory);
      this.component = componentRef.instance as CfEndpointDetailsComponent;
    }
    this.component.row = this.pRow;
    this.component.spaceBetween = true;
  }
}
