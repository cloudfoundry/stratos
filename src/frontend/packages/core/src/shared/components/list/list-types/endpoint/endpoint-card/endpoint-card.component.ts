import { Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { EndpointTypeConfig } from '../../../../../../core/extension/extension-types';
import { getFavoriteFromEndpointEntity } from '../../../../../../core/user-favorite-helpers';
import {
  endpointListDetailsComponents,
  getEndpointType,
  getFullEndpointApiUrl,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { BaseEndpointsDataSource } from '../../cf-endpoints/base-endpoints-data-source';
import { CfEndpointDetailsComponent } from '../cf-endpoint-details/cf-endpoint-details.component';
import { EndpointListHelper } from '../endpoint-list.helpers';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss'],
  entryComponents: [...endpointListDetailsComponents]
})
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit {

  public rowObs = new ReplaySubject<EndpointModel>();
  public favorite: UserFavoriteEndpoint;
  public address: string;
  public cardMenu: MetaCardMenuItem[];
  public endpointConfig: EndpointTypeConfig;
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
    if (!row) {
      return;
    }
    this.pRow = row;
    this.endpointConfig = getEndpointType(row.cnsi_type);
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    this.updateDetails();

  }
  get row(): EndpointModel {
    return this.pRow;
  }

  @Input('dataSource')
  set dataSource(ds: BaseEndpointsDataSource) {
    if (ds.endpointType !== 'cf' && !this.cardMenu) {
      this.cardMenu = this.endpointListHelper.endpointActions().map(endpointAction => ({
        label: endpointAction.label,
        action: () => endpointAction.action(this.pRow),
        can: endpointAction.createVisible(this.rowObs)
      }));
    }
  }

  constructor(
    private endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    super();
  }

  ngOnInit() {
    this.favorite = this.pRow.cnsi_type === 'cf' ? getFavoriteFromEndpointEntity(this.row) : null;
    const e = getEndpointType(this.pRow.cnsi_type);
    this.hasDetails = !!e.listDetailsComponent;
  }

  getLinkForEndpoint() {
    return EndpointsService.getLinkForEndpoint(this.row);
  }

  updateDetails() {
    if (!this.endpointDetails || !this.pRow) {
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
    this.component.spaceBetween = false;
  }
}
