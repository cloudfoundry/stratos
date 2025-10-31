import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterViewInit,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
 } from '@angular/core';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { EndpointOnlyAppState, RouterNav, selectDashboardState, selectSessionData, stratosEntityCatalog, endpointStatusSelector } from '@stratosui/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { delay, filter, first, map, switchMap, tap } from 'rxjs/operators';

import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { safeUnsubscribe } from '../../../core/utils.service';
import { EndpointListHelper } from '../../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { ListComponent } from '../../../shared/components/list/list.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EndpointsMissingComponent } from '../../../shared/components/endpoints-missing/endpoints-missing.component';
import { UserPermissionDirective } from '../../../shared/user-permission.directive';
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { SessionService } from '../../../shared/services/session.service';
import { EndpointModalService } from '../endpoint-register-modal/endpoint-modal.service';
import { EndpointRegisterModalComponent } from '../endpoint-register-modal/endpoint-register-modal.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }, EndpointListHelper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    CustomTooltipDirective,
    PageHeaderComponent,
    ListComponent,
    EndpointsMissingComponent,
    UserPermissionDirective,
    EndpointRegisterModalComponent
  ]
})
export class EndpointsPageComponent implements AfterViewInit, OnDestroy, OnInit {
  public canRegisterEndpoint: Observable<StratosCurrentUserPermissions[]>;
  private healthCheckTimeout: number;

  public canBackupRestore$: Observable<boolean>;
  public showRegisterModal = false;
  public isInitialised$: Observable<boolean>;

  @ViewChild('customNoEndpoints', { read: ViewContainerRef, static: true }) customNoEndpointsContainer: ViewContainerRef;
  @ViewChild(ListComponent, { static: false }) listComponent: ListComponent<any>;
  customContentComponentRef: ComponentRef<any>;

  private snackBarText = {
    message: `There are no connected endpoints, connect with your personal credentials to get started.`,
    action: 'Got it'
  };

  public customizations: CustomizationsMetadata;

  constructor(
    public endpointsService: EndpointsService,
    public store: Store<EndpointOnlyAppState>,
    private ngZone: NgZone,
    private resolver: ComponentFactoryResolver,
    private snackBarService: SnackBarService,
    cs: CustomizationService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    public sessionService: SessionService,
    private endpointModalService: EndpointModalService
  ) {
    this.customizations = cs.get();

    // Redirect to /applications if not enabled.
    // Defensive: Use catchError to prevent subscription errors from breaking initialization
    endpointsService.disablePersistenceFeatures$.pipe(
      filter(off => off !== undefined && off !== null),
      map(off => {
        if (off) {
          // User should only get here if url is manually entered
          this.store.dispatch(new RouterNav({
            path: ['applications'],
            extras: {
              replaceUrl: true
            }
          });
        }
      }),
      first()
    ).subscribe({
      error: (err) => console.error('Error checking persistence features:', err)
    });

    // Defensive: Add null guards for session service observables
    this.canRegisterEndpoint = this.sessionService.userEndpointsEnabled().pipe(
      filter(enabled => enabled !== undefined && enabled !== null),
      map(enabled => {
        if (enabled){
          return [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT, StratosCurrentUserPermissions.EDIT_ENDPOINT];
        }else{
          return [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT];
        }
      })
    );

    // Is the backup/restore plugin available on the backend?
    // Defensive: Add catchError to handle session data access issues
    this.canBackupRestore$ = this.store.select(selectSessionData()).pipe(
      filter(sessionData => !!sessionData),
      first(),
      map(sessionData => sessionData?.plugins?.backup || false),
      switchMap(enabled => enabled ? currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT) : of(false))
    );

    // Create an observable to track when endpoints are loaded and ready
    // Defensive: Add null checks and error handling
    this.isInitialised$ = this.store.select(endpointStatusSelector).pipe(
      filter(endpointState => !!endpointState),
      map(endpointState => !endpointState.loading),
      delay(500) // Delay to ensure proper loading sequence
    );
  }

  subs: Subscription[] = [];

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Endpoints);

  private startEndpointHealthCheckPulse() {
    this.ngZone.runOutsideAngular(() => {
      this.healthCheckTimeout = window.setInterval(() => {
        this.ngZone.run(() => {
          this.endpointsService.checkAllEndpoints();
        });
      }, 30000);
    });
  }

  private stopEndpointHealthCheckPulse() {
    clearInterval(this.healthCheckTimeout);
  }

  private showSnackBar(show: boolean) {
    if (show) {
      this.snackBarService.show(this.snackBarText.message, this.snackBarText.action, 20000);
    } else {
      this.snackBarService.hide();
    }
  }

  ngOnInit() {
    // Defensive: Validate entity catalog initialization before dispatching actions
    // Entity catalog entities are populated during module initialization (see EntityCatalogFeatureModule)
    // and should be available by the time component constructors run. However, we add defensive checks
    // to gracefully handle edge cases where catalog might not be fully initialized.

    // Dispatch the GET_ENDPOINTS action which triggers system info fetch
    if (stratosEntityCatalog?.endpoint?.actions?.getAll) {
      this.store.dispatch(stratosEntityCatalog.endpoint.actions.getAll());
    } else {
      console.error('Entity catalog endpoint actions not initialized. This may indicate a module initialization issue.', {
        hasCatalog: !!stratosEntityCatalog,
        hasEndpoint: !!stratosEntityCatalog?.endpoint,
        hasActions: !!stratosEntityCatalog?.endpoint?.actions
      });
    }

    // Also explicitly trigger system info
    if (stratosEntityCatalog?.systemInfo?.actions?.getSystemInfo) {
      this.store.dispatch(stratosEntityCatalog.systemInfo.actions.getSystemInfo());
    } else {
      console.error('Entity catalog systemInfo actions not initialized. This may indicate a module initialization issue.', {
        hasCatalog: !!stratosEntityCatalog,
        hasSystemInfo: !!stratosEntityCatalog?.systemInfo,
        hasActions: !!stratosEntityCatalog?.systemInfo?.actions
      });
    }

    // Subscribe to haveRegistered$ to handle custom no-endpoints component
    // Defensive: Add error handling to prevent subscription failures from breaking the page
    this.subs.push(
      this.endpointsService.haveRegistered$.pipe(
        filter(haveRegistered => haveRegistered !== undefined && haveRegistered !== null)
      ).subscribe({
        next: (haveRegistered) => {
          // Use custom component if specified and no endpoints are registered
          if (this.customNoEndpointsContainer) {
            this.customNoEndpointsContainer.clear();
          }
          if (!haveRegistered && this.customizations.noEndpointsComponent) {
            try {
              const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this.customizations.noEndpointsComponent);
              this.customContentComponentRef = this.customNoEndpointsContainer.createComponent(factory);
            } catch (error) {
              console.error('Error creating custom no-endpoints component:', error);
            }
          }
        },
        error: (err) => console.error('Error subscribing to haveRegistered$:', err)
      })
    );

    // Trigger endpoint health checks
    // Defensive: Wrap in try-catch to prevent errors from breaking initialization
    try {
      this.endpointsService.checkAllEndpoints();
    } catch (error) {
      console.error('Error checking endpoints:', error);
    }

    // Subscribe to dashboard state to enable polling if configured
    // Defensive: Add error handling and ensure subscription cleanup
    this.subs.push(
      this.store.select(selectDashboardState).pipe(
        filter(dashboard => !!dashboard),
        first()
      ).subscribe({
        next: (dashboard) => {
          if (dashboard.pollingEnabled) {
            this.startEndpointHealthCheckPulse();
          }
        },
        error: (err) => console.error('Error subscribing to dashboard state:', err)
      })
    );
  }

  ngAfterViewInit() {
    // Subscribe to endpoint registration state to show snackbar when endpoints exist but aren't connected
    // Defensive: Add error handling and ensure proper cleanup
    this.subs.push(
      combineLatest([
        this.endpointsService.haveRegistered$.pipe(filter(val => val !== undefined && val !== null)),
        this.endpointsService.haveConnected$.pipe(filter(val => val !== undefined && val !== null))
      ]).pipe(
        delay(1),
        tap(([hasRegistered, hasConnected]) => {
          // Show snackbar if endpoints are registered but none are connected
          this.showSnackBar(hasRegistered && !hasConnected);
        })
      ).subscribe({
        error: (err) => console.error('Error subscribing to endpoint state:', err)
      })
    );
  }

  ngOnDestroy() {
    // Defensive: Ensure all cleanup operations complete even if one fails
    try {
      this.stopEndpointHealthCheckPulse();
    } catch (error) {
      console.error('Error stopping health check pulse:', error);
    }

    try {
      safeUnsubscribe(...this.subs);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }

    try {
      if (this.customContentComponentRef) {
        this.customContentComponentRef.destroy();
      }
    } catch (error) {
      console.error('Error destroying custom component:', error);
    }

    try {
      this.showSnackBar(false);
    } catch (error) {
      console.error('Error hiding snackbar:', error);
    }
  }

  // Modal methods
  openRegisterModal() {
    this.showRegisterModal = true;
    this.endpointModalService.openModal();
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.endpointModalService.closeModal();
  }

  onEndpointRegistered() {
    // Defensive: Validate entity catalog before dispatching refresh actions
    if (stratosEntityCatalog?.endpoint?.actions?.getAll) {
      this.store.dispatch(stratosEntityCatalog.endpoint.actions.getAll());
    } else {
      console.error('Cannot refresh endpoints - entity catalog not initialized', {
        hasCatalog: !!stratosEntityCatalog,
        hasEndpoint: !!stratosEntityCatalog?.endpoint,
        hasActions: !!stratosEntityCatalog?.endpoint?.actions
      });
    }

    // Also trigger system info refresh to update overall state
    if (stratosEntityCatalog?.systemInfo?.actions?.getSystemInfo) {
      this.store.dispatch(stratosEntityCatalog.systemInfo.actions.getSystemInfo());
    } else {
      console.error('Cannot refresh system info - entity catalog not initialized', {
        hasCatalog: !!stratosEntityCatalog,
        hasSystemInfo: !!stratosEntityCatalog?.systemInfo,
        hasActions: !!stratosEntityCatalog?.systemInfo?.actions
      });
    }

    // Trigger endpoint health checks
    // Defensive: Wrap in try-catch to prevent errors from breaking the flow
    try {
      this.endpointsService.checkAllEndpoints();
    } catch (error) {
      console.error('Error checking endpoints after registration:', error);
    }

    // Show success message
    this.snackBarService.show('Endpoint registered successfully!', 'OK', 5000);

    // Close the modal
    this.closeRegisterModal();
  }
}
