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
  coreEndpointListDetailsComponents,
  getEndpointType,
  getFullEndpointApiUrl,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { StratosStatus } from '../../../../../shared.types';
import { favoritesConfigMapper } from '../../../../favorites-meta-card/favorite-config-mapper';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { BaseEndpointsDataSource } from '../base-endpoints-data-source';
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
  public endpointParentType: string;
  private endpointIds = new ReplaySubject<string[]>();
  public endpointIds$: Observable<string[]>;
  public cardStatus$: Observable<StratosStatus>;
  private subs: Subscription[] = [];

  private componentRef: ComponentRef<EndpointListDetailsComponent>;

  @Input() component: EndpointListDetailsComponent;
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
    this.endpointConfig = getEndpointType(row.cnsi_type, row.sub_type);
    this.endpointParentType = row.sub_type ? getEndpointType(row.cnsi_type, null).label : null;
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    this.endpointLink = row.connectionStatus === 'connected' || this.endpointConfig.doesNotSupportConnect ?
      EndpointsService.getLinkForEndpoint(row) : null;
    this.updateInnerComponent();

  }
  get row(): EndpointModel {
    return this.pRow;
  }

  private pDs: BaseEndpointsDataSource;
  @Input('dataSource')
  set dataSource(ds: BaseEndpointsDataSource) {
    this.pDs = ds;
    // Don't show card menu if the ds only provides a single endpoint type (for instance the cf endpoint page)
    if (ds && !ds.endpointType && !this.cardMenu) {
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
    const favorite = getFavoriteFromEndpointEntity(this.row);
    if (favorite) {
      this.favorite = favoritesConfigMapper.hasFavoriteConfigForType(favorite) ? favorite : null;
    }
    const e = getEndpointType(this.pRow.cnsi_type, this.pRow.sub_type);
    this.hasDetails = !!e && !!e.listDetailsComponent;
  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
    this.endpointListHelper.destroyEndpointDetails({
      componentRef: this.componentRef,
      component: this.component,
      endpointDetails: this.endpointDetails
    });
  }

  updateInnerComponent() {
    if (!this.endpointDetails || !this.pRow) {
      return;
    }
    const e = getEndpointType(this.pRow.cnsi_type, this.pRow.sub_type);
    if (!e || !e.listDetailsComponent) {
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
    this.component.row = this.pRow;

    this.updateCardStatus();
  }

  updateCardStatus() {
    if (this.row && this.dataSource && this.dataSource.getRowState && !this.cardStatus$) {
      this.cardStatus$ = this.dataSource.getRowState(this.row).pipe(
        map(rowState => rowState.error ? StratosStatus.ERROR : null),
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
