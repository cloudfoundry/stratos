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
import { CurrentUserPermissionsService } from 'frontend/packages/core/src/core/permissions/current-user-permissions.service';
import { AppState } from 'frontend/packages/store/src/app-state';
import { Observable, of, ReplaySubject, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import {
  StratosCatalogEndpointEntity,
} from '../../../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import {
  coreEndpointListDetailsComponents,
  getFullEndpointApiUrl,
} from '../../../../../../features/endpoints/endpoint-helpers';
import { StratosStatus } from '../../../../../shared.types';
import { FavoritesConfigMapper } from '../../../../favorites-meta-card/favorite-config-mapper';
import {
  createMetaCardMenuItemSeparator,
  MetaCardMenuItem,
} from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { BaseEndpointsDataSource } from '../base-endpoints-data-source';
import { EndpointListDetailsComponent, EndpointListHelper } from '../endpoint-list.helpers';
import { RouterNav } from './../../../../../../../../store/src/actions/router.actions';
import { CopyToClipboardComponent } from './../../../../copy-to-clipboard/copy-to-clipboard.component';

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
  public endpointCatalogEntity: StratosCatalogEndpointEntity;
  public hasDetails = true;
  public endpointLink: string = null;
  public endpointParentType: string;
  private endpointIds = new ReplaySubject<string[]>();
  public endpointIds$: Observable<string[]>;
  public cardStatus$: Observable<StratosStatus>;
  private subs: Subscription[] = [];
  public connectionStatus: string;

  private componentRef: ComponentRef<EndpointListDetailsComponent>;

  @Input() component: EndpointListDetailsComponent;
  private endpointDetails: ViewContainerRef;
  @ViewChild('endpointDetails', { read: ViewContainerRef, static: true }) set content(content: ViewContainerRef) {
    this.endpointDetails = content;
    this.updateInnerComponent();
  }

  @ViewChild('copyToClipboard') copyToClipboard: CopyToClipboardComponent;

  private pRow: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    if (!row) {
      return;
    }
    this.pRow = row;

    this.endpointCatalogEntity = entityCatalog.getEndpoint(row.cnsi_type, row.sub_type);
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    if (this.endpointCatalogEntity) {
      const metadata = this.endpointCatalogEntity.builders.entityBuilder.getMetadata(row);
      this.endpointLink = row.connectionStatus === 'connected' || this.endpointCatalogEntity.definition.unConnectable ?
        this.endpointCatalogEntity.builders.entityBuilder.getLink(metadata) : null;
      this.connectionStatus = this.endpointCatalogEntity.definition.unConnectable ? 'connected' : row.connectionStatus;
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

      // Add a copy address to clipboard
      this.cardMenu.push(createMetaCardMenuItemSeparator());
      this.cardMenu.push({
        label: 'Copy address to Clipboard',
        action: () => this.copyToClipboard.copyToClipboard(),
        can: of(true)
      });
    }

    this.updateCardStatus();
  }
  get dataSource() {
    return this.pDs;
  }

  constructor(
    private store: Store<AppState>,
    private endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver,
    private favoritesConfigMapper: FavoritesConfigMapper,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super();
    this.endpointIds$ = this.endpointIds.asObservable();
  }

  ngOnInit() {
    const favorite = this.favoritesConfigMapper.getFavoriteEndpointFromEntity(this.row);
    if (favorite) {
      this.favorite = this.favoritesConfigMapper.hasFavoriteConfigForType(favorite) ? favorite : null;
    }
    const e = this.endpointCatalogEntity.definition;
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
    const e = this.endpointCatalogEntity.definition;
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
    this.componentRef.changeDetectorRef.detectChanges();


    this.updateCardStatus();
  }

  updateCardStatus() {
    if (this.row && this.dataSource && this.dataSource.getRowState && !this.cardStatus$) {
      this.cardStatus$ = this.dataSource.getRowState(this.row).pipe(
        map(rowState => rowState.error ? StratosStatus.ERROR : null),
        startWith(null)
      );
    }
  }

  editEndpoint() {
    const routerLink = `/endpoints/edit/${this.row.guid}`;
    this.store.dispatch(new RouterNav({ path: routerLink }));
  }

}
