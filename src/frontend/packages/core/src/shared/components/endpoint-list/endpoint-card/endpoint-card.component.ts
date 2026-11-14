import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ComponentRef, OnDestroy, OnInit, ViewContainerRef, ChangeDetectorRef, computed, effect, inject, input, untracked, viewChild } from '@angular/core';
import { CustomTooltipDirective } from '../../custom-tooltip/custom-tooltip.directive';
import { RouterModule } from '@angular/router';
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

import { EndpointsSignalService } from '../../../../core/signals/endpoints-signal.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/endpoints.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { CardCell } from '../../signal-list/cell-base';
import { EndpointListDetailsComponent, EndpointListHelper } from '../endpoint-list.helpers';
import { CopyToClipboardComponent } from '../../copy-to-clipboard/copy-to-clipboard.component';
import { CustomIconComponent } from '../../custom-material/custom-material.component';
import { SessionSignalService } from '../../../../core/signals/session-signal.service';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../../core/permissions/stratos-user-permissions.checker';
import { MultilineTitleComponent } from '../../multiline-title/multiline-title.component';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';

// Import non-standalone dependencies directly
import { PageHeaderEventsComponent } from '../../page-header/page-header-events/page-header-events.component';
import { MetaCardComponent } from '../../meta-card/meta-card-base/meta-card.component';
import { MetaCardTitleComponent } from '../../meta-card/meta-card-title/meta-card-title.component';
import { MetaCardItemComponent } from '../../meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../meta-card/meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../../meta-card/meta-card-value/meta-card-value.component';
import { TableCellEndpointStatusComponent } from '../table-cell-endpoint-status/table-cell-endpoint-status.component';
import { DisableRouterLinkDirective } from '../../../../core/disable-router-link.directive';

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
    CustomIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndpointCardComponent extends CardCell<EndpointModel> implements OnInit, OnDestroy {
  private endpointsSignal = inject(EndpointsSignalService);
  private endpoints$ = toObservable(this.endpointsSignal.endpoints);
  private endpointListHelper = inject(EndpointListHelper);
  private userFavoriteManager = inject(UserFavoriteManager);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private sessionSignals = inject(SessionSignalService);
  private cdr = inject(ChangeDetectorRef);


  public favorite: UserFavoriteEndpoint | null = null;

  // Everything below up to `connectionStatus` follows the row.
  public readonly endpointCatalogEntity = computed<StratosCatalogEndpointEntity | undefined>(() => {
    const row = this.row();
    return row?.cnsi_type ? entityCatalog.getEndpoint(row.cnsi_type, row.sub_type) : undefined;
  });
  public readonly address = computed(() => getFullEndpointApiUrl(this.row()));
  public readonly isDuplicate$ = computed<Observable<boolean>>(() => {
    const address = this.address();
    return this.endpoints$.pipe(
      map(entities => Object.values(entities).filter(e => getFullEndpointApiUrl(e) === address).length > 1)
    );
  });
  public readonly endpointLink = computed<string | null>(() => {
    const row = this.row();
    const definition = this.endpointCatalogEntity()?.definition;
    if (!row || !definition) {
      return null;
    }
    return row.connectionStatus === 'connected' || definition.unConnectable ? EndpointsService.getLinkForEndpoint(row) : null;
  });
  public readonly connectionStatus = computed<string | undefined>(() => {
    const definition = this.endpointCatalogEntity()?.definition;
    if (!definition) {
      return undefined;
    }
    return definition.unConnectable ? 'connected' : this.row()?.connectionStatus;
  });

  public hasDetails = true;
  public endpointParentType!: string;
  // strict: never assigned in this component; the meta-card consumes it via
  // an async pipe and tolerates an absent stream.
  public cardStatus$?: Observable<StratosStatus>;
  private subs: Subscription[] = [];
  // The creator shows to admins, and to endpoint admins while user
  // endpoints are enabled.
  private readonly userEndpointsEnabled = this.sessionSignals.userEndpointsEnabled;
  private readonly userEndpointsNotDisabled = this.sessionSignals.userEndpointsNotDisabled;
  private readonly isAdmin = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT);
  private readonly isEndpointAdmin = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ENDPOINT);
  public readonly viewCreator = computed(() =>
    (this.userEndpointsEnabled() && (this.isAdmin() || this.isEndpointAdmin())) ||
    (this.userEndpointsNotDisabled() && this.isAdmin()));

  private componentRef!: ComponentRef<EndpointListDetailsComponent>;

  // Optional per-endpoint kebab menu, rendered by the meta-card header.
  // Consumers that suppress it (e.g. the kubernetes endpoints page) simply
  // leave it unset.
  readonly actionMenu = input<MenuItem[] | null>(null);

  // The endpoint type's own details component, created into #endpointDetails
  // by updateInnerComponent().
  component: EndpointListDetailsComponent | null = null;
  // In the card's own template, so it is resolved when the view is created,
  // before the row is bound: the effect in the constructor fills the
  // container on its first run.
  private readonly endpointDetails = viewChild('endpointDetails', { read: ViewContainerRef });

  // V2 BaseEndpointsDataSource was deleted in W12 — the kubernetes
  // card consumer never bound [dataSource] and the V2 endpoints list
  // (only other consumer) was the only path that did. cardStatus$ is
  // now driven by direct consumer template bindings when needed, not
  // the data-source narrowing the V2 list-config pipeline used to
  // inject.

  constructor() {
    super();
    // Create the details component once the row's type is known, and hand it
    // each new row. Untracked: only the row and its type should re-run this,
    // not whatever the details component reads while it is created.
    effect(() => {
      const row = this.row();
      const entity = this.endpointCatalogEntity();
      untracked(() => this.updateInnerComponent(row, entity));
    });
  }

  ngOnInit() {
    this.favorite = this.userFavoriteManager.getFavoriteEndpointFromEntity(this.row());
    const e = this.endpointCatalogEntity()?.definition;
    this.hasDetails = !!e && !!e.listDetailsComponent;
  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
    this.endpointListHelper.destroyEndpointDetails({
      componentRef: this.componentRef,
      component: this.component,
      endpointDetails: this.endpointDetails()
    });
  }

  private updateInnerComponent(row: EndpointModel, entity: StratosCatalogEndpointEntity | undefined) {
    const endpointDetails = this.endpointDetails();
    if (!endpointDetails || !row || !entity) {
      return;
    }
    const e = entity.definition;
    if (!e || !e.listDetailsComponent) {
      return;
    }

    if (!this.component) {
      const res =
        this.endpointListHelper.createEndpointDetails(e.listDetailsComponent, endpointDetails);
      this.componentRef = res.componentRef;
      this.component = res.component;
    }

    if (this.component) {
      this.componentRef.setInput('row', row);
      this.component.isTable = false;
      this.componentRef.changeDetectorRef.detectChanges();
    }
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
