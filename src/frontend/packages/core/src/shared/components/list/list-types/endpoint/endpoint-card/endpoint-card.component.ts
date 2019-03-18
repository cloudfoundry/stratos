import { Component, ComponentFactoryResolver, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { filter, first, map, pairwise, startWith } from 'rxjs/operators';

import { SetHeaderEvent } from '../../../../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { EndpointTypeConfig } from '../../../../../../core/extension/extension-types';
import { getFavoriteFromEndpointEntity } from '../../../../../../core/user-favorite-helpers';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import {
  endpointListDetailsComponents,
  getEndpointType,
  getFullEndpointApiUrl,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { CardStatus } from '../../../../../shared.types';
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
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit, OnDestroy {
  public rowObs = new ReplaySubject<EndpointModel>();
  public favorite: UserFavoriteEndpoint;
  public address: string;
  public cardMenu: MetaCardMenuItem[];
  public endpointConfig: EndpointTypeConfig;
  public hasDetails = true;
  public endpointLink: string = null;
  private endpointIds = new ReplaySubject<string[]>();
  public endpointIds$: Observable<string[]>;
  public cardStatus$: Observable<CardStatus>;
  private subs: Subscription[] = [];

  @Input() component: CfEndpointDetailsComponent;
  private endpointDetails: ViewContainerRef;
  @ViewChild('endpointDetails', { read: ViewContainerRef }) set content(content: ViewContainerRef) {
    this.endpointDetails = content;
    this.updateInnerComponent();
  }

  private pRow: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    if (!row) {
      return;
    }
    this.pRow = row;
    this.endpointIds.next([row.guid]);
    this.endpointConfig = getEndpointType(row.cnsi_type);
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    this.endpointLink = row.connectionStatus === 'connected' ? EndpointsService.getLinkForEndpoint(row) : null;
    this.updateInnerComponent();

  }
  get row(): EndpointModel {
    return this.pRow;
  }

  private pDs: BaseEndpointsDataSource;
  @Input('dataSource')
  set dataSource(ds: BaseEndpointsDataSource) {
    this.pDs = ds;
    if (!ds) {
      return;
    }

    if (!this.cardMenu) {
      this.cardMenu = this.endpointListHelper.endpointActions().map(endpointAction => ({
        label: endpointAction.label,
        action: () => endpointAction.action(this.pRow),
        can: endpointAction.createVisible(this.rowObs)
      }));
    }

    this.updateCardStatus();
  }
  get dataSource() {
    return this.pDs;
  }

  constructor(
    private store: Store<AppState>,
    private endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    super();
    this.endpointIds$ = this.endpointIds.asObservable();
  }

  ngOnInit() {
    this.favorite = this.pRow.cnsi_type === 'cf' ? getFavoriteFromEndpointEntity(this.row) : null;
    const e = getEndpointType(this.pRow.cnsi_type);
    this.hasDetails = !!e.listDetailsComponent;
  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
  }

  updateInnerComponent() {
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

    this.updateCardStatus();
  }

  updateCardStatus() {
    if (this.row && this.dataSource && this.dataSource.getRowState && !this.cardStatus$) {
      this.cardStatus$ = this.dataSource.getRowState(this.row).pipe(
        map(rowState => rowState.error ? CardStatus.ERROR : null),
        startWith(null)
      );

      this.subs.push(this.cardStatus$.pipe(
        pairwise(),
        filter(([oldV, newV]) => !oldV && !!newV),
        first()
      ).subscribe(() => this.store.dispatch(new SetHeaderEvent(true))));
    }
  }
}
