import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { EndpointTypeConfig } from '../../../../../../core/extension/extension-types';
import { getFavoriteFromEndpointEntity } from '../../../../../../core/user-favorite-helpers';
import {
  coreEndpointListDetailsComponents,
  getEndpointType,
  getFullEndpointApiUrl,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { BaseEndpointsDataSource } from '../../cf-endpoints/base-endpoints-data-source';
import { EndpointListDetailsComponent, EndpointListHelper } from '../endpoint-list.helpers';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss'],
  entryComponents: [...coreEndpointListDetailsComponents]
})
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit, OnDestroy {

  public rowObs = new ReplaySubject<EndpointModel>();
  public favorite: UserFavoriteEndpoint;
  public address: string;
  public cardMenu: MetaCardMenuItem[];
  public endpointConfig: EndpointTypeConfig;
  public hasDetails = true;
  public endpointLink: string = null;

  private componentRef: ComponentRef<EndpointListDetailsComponent>;

  @Input() component: EndpointListDetailsComponent;
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
    this.endpointLink = row.connectionStatus === 'connected' ? EndpointsService.getLinkForEndpoint(row) : null;
    this.updateDetails();

  }
  get row(): EndpointModel {
    return this.pRow;
  }

  @Input('dataSource')
  set dataSource(ds: BaseEndpointsDataSource) {
    if (ds && ds.endpointType !== 'cf' && !this.cardMenu) {
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

  ngOnDestroy(): void {
    this.endpointListHelper.destroyEndpointDetails({
      componentRef: this.componentRef,
      component: this.component,
      endpointDetails: this.endpointDetails
    });
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
      const res =
        this.endpointListHelper.createEndpointDetails(e.listDetailsComponent, this.endpointDetails, this.componentFactoryResolver);
      this.componentRef = res.componentRef;
      this.component = res.component;
    }

    if (this.component) {
      this.component.row = this.pRow;
      this.component.isTable = false;
    }
  }

}
