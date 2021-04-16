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
import { combineLatest, Observable, of, ReplaySubject, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AppState } from '../../../../../../../../store/src/app-state';
import { getFullEndpointApiUrl } from '../../../../../../../../store/src/endpoint-utils';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import {
  StratosCatalogEndpointEntity,
} from '../../../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import { UserFavoriteEndpoint } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import { coreEndpointListDetailsComponents } from '../../../../../../features/endpoints/endpoint-helpers';
import { createMetaCardMenuItemSeparator } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import { BaseEndpointsDataSource } from '../base-endpoints-data-source';
import { EndpointListDetailsComponent, EndpointListHelper } from '../endpoint-list.helpers';
import { RouterNav } from './../../../../../../../../store/src/actions/router.actions';
import { CopyToClipboardComponent } from './../../../../copy-to-clipboard/copy-to-clipboard.component';
import { SessionService } from '../../../../../services/session.service';
import { CurrentUserPermissionsService } from '../../../../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../../../../core/permissions/stratos-user-permissions.checker';

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
  public cardMenu: MenuItem[];
  public endpointCatalogEntity: StratosCatalogEndpointEntity;
  public hasDetails = true;
  public endpointLink: string = null;
  public endpointParentType: string;
  private endpointIds = new ReplaySubject<string[]>();
  public endpointIds$: Observable<string[]>;
  public cardStatus$: Observable<StratosStatus>;
  private subs: Subscription[] = [];
  public connectionStatus: string;
  public viewCreator$: Observable<boolean>;

  private componentRef: ComponentRef<EndpointListDetailsComponent>;

  @Input() component: EndpointListDetailsComponent;
  private endpointDetails: ViewContainerRef;
  @ViewChild('endpointDetails', { read: ViewContainerRef, static: true }) set content(content: ViewContainerRef) {
    this.endpointDetails = content;
    this.updateInnerComponent();
  }

  @ViewChild('copyToClipboard') copyToClipboard: CopyToClipboardComponent;

  @Input('row')
  set row(row: EndpointModel) {
    super.row = row;
    if (!row) {
      return;
    }

    this.endpointCatalogEntity = entityCatalog.getEndpoint(row.cnsi_type, row.sub_type);
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    if (this.endpointCatalogEntity) {
      this.endpointLink = row.connectionStatus === 'connected' || this.endpointCatalogEntity.definition.unConnectable ?
        EndpointsService.getLinkForEndpoint(row) : null;
      this.connectionStatus = this.endpointCatalogEntity.definition.unConnectable ? 'connected' : row.connectionStatus;
    }
    this.updateInnerComponent();

  }
  get row(): EndpointModel {
    return super.row;
  }

  @Input('dataSource')
  set dataSource(ds: BaseEndpointsDataSource) {
    super.dataSource = ds;

    // Don't show card menu if the ds only provides a single endpoint type (for instance the cf endpoint page)
    if (ds && !ds.dsEndpointType && !this.cardMenu) {
      this.cardMenu = this.endpointListHelper.endpointActions(true).map(endpointAction => {
        const separator = endpointAction.label === '-';
        return {
          label: endpointAction.label,
          action: () => endpointAction.action(this.row),
          can: endpointAction.createVisible ? endpointAction.createVisible(this.rowObs) : null,
          separator
        };
      });

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

  constructor(
    private store: Store<AppState>,
    private endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver,
    private userFavoriteManager: UserFavoriteManager,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private sessionService: SessionService,
  ) {
    super();
    this.endpointIds$ = this.endpointIds.asObservable();
  }

  ngOnInit() {
    this.favorite = this.userFavoriteManager.getFavoriteEndpointFromEntity(this.row);
    const e = this.endpointCatalogEntity.definition;
    this.hasDetails = !!e && !!e.listDetailsComponent;
    this.viewCreator$ = combineLatest([
      this.sessionService.userEndpointsEnabled(),
      this.sessionService.userEndpointsNotDisabled(),
      this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT),
      this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ENDPOINT)
    ]).pipe(
      map(([userEndpointsEnabled, userEndpointsNotDisabled, isAdmin, isEndpointAdmin]) => {
        return (userEndpointsEnabled && (isAdmin || isEndpointAdmin)) || (userEndpointsNotDisabled && isAdmin);
      })
    );
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
    if (!this.endpointDetails || !this.row) {
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
      this.component.row = this.row;
      this.component.isTable = false;
    }
    this.component.row = this.row;
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
