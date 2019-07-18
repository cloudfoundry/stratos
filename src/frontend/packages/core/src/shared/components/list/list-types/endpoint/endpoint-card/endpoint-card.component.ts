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

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { SetHeaderEvent } from '../../../../../../../../store/src/actions/dashboard-actions';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { StratosCatalogueEndpointEntity } from '../../../../../../core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../../../../core/entity-catalogue/entity-catalogue.service';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import {
  coreEndpointListDetailsComponents,
  getFullEndpointApiUrl,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { StratosStatus } from '../../../../../shared.types';
import { FavoritesConfigMapper } from '../../../../favorites-meta-card/favorite-config-mapper';
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
  public endpointCatalogueEntity: StratosCatalogueEndpointEntity;
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

    this.endpointCatalogueEntity = entityCatalogue.getEndpoint(row.cnsi_type, row.sub_type);
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    if (this.endpointCatalogueEntity) {
      const metadata = this.endpointCatalogueEntity.builders.entityBuilder.getMetadata(row);
      this.endpointLink = row.connectionStatus === 'connected' || this.endpointCatalogueEntity.definition.unConnectable ?
        this.endpointCatalogueEntity.builders.entityBuilder.getLink(metadata) : null;
    }
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
    if (ds && !ds.dsEndpointType && !this.cardMenu) {
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
    private store: Store<CFAppState>,
    private endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver,
    private favoritesConfigMapper: FavoritesConfigMapper,

  ) {
    super();
    this.endpointIds$ = this.endpointIds.asObservable();
  }

  ngOnInit() {
    const favorite = this.favoritesConfigMapper.getFavoriteEndpointFromEntity(this.row);
    if (favorite) {
      this.favorite = this.favoritesConfigMapper.hasFavoriteConfigForType(favorite) ? favorite : null;
    }
    const e = this.endpointCatalogueEntity.definition;
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
    const e = this.endpointCatalogueEntity.definition;
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
