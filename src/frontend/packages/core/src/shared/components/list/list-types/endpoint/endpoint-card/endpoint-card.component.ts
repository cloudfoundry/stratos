import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ComponentRef, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef, ChangeDetectorRef, inject } from '@angular/core';
import { CustomTooltipDirective } from '../../../../custom-tooltip/custom-tooltip.directive';
import { Router, RouterModule } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  EndpointModel,
  entityCatalog,
  getFullEndpointApiUrl,
  MenuItem,
  StratosCatalogEndpointEntity,
  StratosStatus,
  UserFavoriteEndpoint,
  UserFavoriteManager,
} from '@stratosui/store';

import { EndpointsSignalService } from '../../../../../../core/signals/endpoints-signal.service';
import { combineLatest, Observable, of, ReplaySubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsService } from '../../../../../../core/endpoints.service';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import { CardCell } from '../../../list.types';
import { EndpointListDetailsComponent, EndpointListHelper } from '../endpoint-list.helpers';
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
  private router = inject(Router);
  private endpointsSignal = inject(EndpointsSignalService);
  private endpoints$ = toObservable(this.endpointsSignal.endpoints);
  private endpointListHelper = inject(EndpointListHelper);
  private userFavoriteManager = inject(UserFavoriteManager);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private sessionService = inject(SessionService);
  private cdr = inject(ChangeDetectorRef);


  public rowObs = new ReplaySubject<EndpointModel>();
  public favorite?: UserFavoriteEndpoint;
  public address!: string;
  public isDuplicate$!: Observable<boolean>;
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

  @Input()
  set row(row: EndpointModel) {
    super.row = row;
    if (!row) {
      console.log('Row set to null/undefined');
      return;
    }
    this.endpointCatalogEntity = entityCatalog.getEndpoint(row.cnsi_type, row.sub_type);
    this.address = getFullEndpointApiUrl(row);
    this.isDuplicate$ = this.endpoints$.pipe(
      map(entities => Object.values(entities).filter(e => getFullEndpointApiUrl(e) === this.address).length > 1)
    );
    this.rowObs.next(row);
    if (this.endpointCatalogEntity?.definition) {
      this.endpointLink = row.connectionStatus === 'connected' || this.endpointCatalogEntity.definition.unConnectable ?
        EndpointsService.getLinkForEndpoint(row) : null;
      this.connectionStatus = this.endpointCatalogEntity.definition.unConnectable ? 'connected' : row.connectionStatus;
    }
    this.updateInnerComponent();
  }
  get row(): EndpointModel {
    return super.row;
  }
  // V2 BaseEndpointsDataSource was deleted in W12 — the kubernetes
  // card consumer never bound [dataSource] and the V2 endpoints list
  // (only other consumer) was the only path that did. Card menu +
  // cardStatus$ are now driven by direct consumer template bindings
  // when needed, not the data-source narrowing the V2 list-config
  // pipeline used to inject.

  constructor() {
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
        this.endpointListHelper.createEndpointDetails(e.listDetailsComponent, this.endpointDetails);
      this.componentRef = res.componentRef;
      this.component = res.component;
    }

    if (this.component) {
      this.component.row = this.row;
      this.component.isTable = false;
    }
    this.component.row = this.row;
    this.componentRef.changeDetectorRef.detectChanges();
  }

  editEndpoint() {
    const routerLink = `/endpoints/edit/${this.row.guid}`;
    this.router.navigate(routerLink.split('/'));
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
