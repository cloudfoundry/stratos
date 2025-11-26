import { CommonModule, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  type ComponentRef,
  Input,
  type OnDestroy,
  type OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CustomTooltipDirective } from '../../../../custom-tooltip/custom-tooltip.directive';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  getFullEndpointApiUrl,
  entityCatalog,
  type MenuItem,
  StratosStatus,
  type StratosCatalogEndpointEntity,
  type EndpointModel,
  type UserFavoriteEndpoint,
  UserFavoriteManager,
  RouterNav,
  type AppState,
} from '@stratosui/store';
import { combineLatest, type Observable, of, ReplaySubject, type Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { EndpointsService } from '../../../../../../core/endpoints.service';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import { createMetaCardMenuItemSeparator } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';
import type { BaseEndpointsDataSource } from '../base-endpoints-data-source';
import { EndpointListHelper } from '../endpoint-list.helpers';
import type { EndpointListDetailsComponent } from '../endpoint-list.helpers';
import { CopyToClipboardComponent } from './../../../../copy-to-clipboard/copy-to-clipboard.component';
import { SessionService } from '../../../../../services/session.service';
import { CurrentUserPermissionsService } from '../../../../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../../../../core/permissions/stratos-user-permissions.checker';
import { MultilineTitleComponent } from '../../../../multiline-title/multiline-title.component';
import { BooleanIndicatorComponent } from '../../../../boolean-indicator/boolean-indicator.component';

// Import non-standalone dependencies directly
import { PageHeaderEventsComponent } from '../../../../page-header/page-header-events/page-header-events.component';
import { MetaCardComponent } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardTitleComponent } from '../../../list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardItemComponent } from '../../../list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../../list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../../../list-cards/meta-card/meta-card-value/meta-card-value.component';
import { TableCellEndpointStatusComponent } from '../table-cell-endpoint-status/table-cell-endpoint-status.component';
import { DisableRouterLinkDirective } from '../../../../../../core/disable-router-link.directive';

@Component({
  selector: 'app-endpoint-card',
  templateUrl: './endpoint-card.component.html',
  styleUrls: ['./endpoint-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    PageHeaderEventsComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    TableCellEndpointStatusComponent,
    DisableRouterLinkDirective,
    MultilineTitleComponent,
    CopyToClipboardComponent,
    BooleanIndicatorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit, OnDestroy {

  public rowObs = new ReplaySubject<EndpointModel>();
  public favorite?: UserFavoriteEndpoint;
  public address!: string;
  public cardMenu!: MenuItem[];
  public endpointCatalogEntity!: StratosCatalogEndpointEntity;
  public hasDetails = true;
  public endpointLink: string | null = null;
  public endpointParentType!: string;
  private endpointIds = new ReplaySubject<string[]>();
  public endpointIds$: Observable<string[]>;
  public cardStatus$: Observable<StratosStatus>;
  private subs: Subscription[] = [];
  public connectionStatus!: string;
  public viewCreator$!: Observable<boolean>;

  private componentRef!: ComponentRef<EndpointListDetailsComponent>;

  @Input() component: EndpointListDetailsComponent | null = null;
  private endpointDetails!: ViewContainerRef;
  @ViewChild('endpointDetails', { read: ViewContainerRef, static: true }) set content(content: ViewContainerRef) {
    this.endpointDetails = content;
    this.updateInnerComponent();
  }

  @ViewChild('copyToClipboard') copyToClipboard!: CopyToClipboardComponent;

  @Input('row')
  set row(row: EndpointModel) {
    super.row = row;
    if (!row) {
      console.log('Row set to null/undefined');
      return;
    }
    this.endpointCatalogEntity = entityCatalog.getEndpoint(row.cnsi_type, row.sub_type);
    this.address = getFullEndpointApiUrl(row);
    this.rowObs.next(row);
    if (this.endpointCatalogEntity?.definition) {
      this.endpointLink = row.connectionStatus === 'connected' || this.endpointCatalogEntity.definition.unConnectable ?
        EndpointsService.getLinkForEndpoint(row) : null;
      this.connectionStatus = this.endpointCatalogEntity.definition.unConnectable ? 'connected' : row.connectionStatus;
    }
    this.updateInnerComponent();

    // Try to create the card menu now that we have a row
    this.createCardMenuIfReady();
  }
  get row(): EndpointModel {
    return super.row;
  }

  private _dataSource!: BaseEndpointsDataSource;

  @Input('dataSource')
  set dataSource(ds: BaseEndpointsDataSource) {
    super.dataSource = ds;
    this._dataSource = ds;

    // Try to create the card menu now that we have a dataSource
    this.createCardMenuIfReady();

    this.updateCardStatus();
  }

  get dataSource(): BaseEndpointsDataSource {
    return this._dataSource;
  }

  private createCardMenuIfReady() {
    // Don't show card menu if the ds only provides a single endpoint type (for instance the cf endpoint page)
    if (this.dataSource && !this.dataSource.dsEndpointType && !this.cardMenu && this.row) {
      if (this.endpointListHelper) {
        try {
          const actions = this.endpointListHelper.endpointActions(true);

          this.cardMenu = actions.map(endpointAction => {
            const separator = endpointAction.label === '-';
            return {
              label: endpointAction.label,
              action: () => endpointAction.action(this.row),
              can: endpointAction.createVisible ? endpointAction.createVisible(this.rowObs) : of(true),
              separator
            };
          });

          // Add a copy address to clipboard - this should always be visible
          this.cardMenu.push(createMetaCardMenuItemSeparator());
          this.cardMenu.push({
            label: 'Copy address to Clipboard',
            action: () => this.copyToClipboard.copyToClipboard(),
            can: of(true),
            separator: false
          });

          // Force at least one action to be visible so the menu shows
          if (this.cardMenu.length > 0) {
            // Ensure the last item (copy to clipboard) is always visible
            const lastItem = this.cardMenu[this.cardMenu.length - 1];
            if (lastItem && !lastItem.separator) {
              lastItem.can = of(true);
            }
          }
        } catch (error) {
          console.error('❌ Error creating card menu:', error);
        }
      }
    }
  }

  constructor(
    private store: Store<AppState>,
    private endpointListHelper: EndpointListHelper,
    private componentFactoryResolver: ComponentFactoryResolver,
    private userFavoriteManager: UserFavoriteManager,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private sessionService: SessionService,_cdr: ChangeDetectorRef,
  ) {
    super();
    this.endpointIds$ = this.endpointIds.asObservable();
  }

  ngOnInit() {
    this.favorite = this.userFavoriteManager.getFavoriteEndpointFromEntity(this.row);
    const e = this.endpointCatalogEntity?.definition;
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
    if (!this.endpointDetails || !this.row || !this.endpointCatalogEntity) {
      return;
    }
    const e = this.endpointCatalogEntity.definition;
    if (!e || !e.listDetailsComponent) {
      return;
    }

    if (!this.component) {
      const res =
        this.endpointListHelper.createEndpointDetails(e.listDetailsComponent as typeof EndpointListDetailsComponent, this.endpointDetails, this.componentFactoryResolver);
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

  /**
   * Handle image loading errors to prevent retry loops
   * Removes the src to stop browser from continuously retrying
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      console.warn(`Failed to load endpoint icon: ${img.src}`);
      // Clear src to prevent retry loop
      img.src = '';
      // Optionally hide the image wrapper
      const wrapper = img.closest('.endpoint-card__image-wrapper') as HTMLElement;
      if (wrapper) {
        wrapper.style.display = 'none';
      }
    }
  }

}

// Register this card component to avoid circular dependency issues
import { listCards } from '../../../list-cards/card/card.component';
listCards.push(EndpointCardComponent);
