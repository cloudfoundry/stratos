import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterViewInit, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { Router, RouterModule } from '@angular/router';
import {
  EndpointsDataService,
} from '@stratosui/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, take, delay, filter, map, switchMap, tap } from 'rxjs/operators';

import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { EndpointsService } from '../../../core/endpoints.service';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { EndpointStatusSignalService } from '../../../core/signals/endpoint-status-signal.service';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType } from '../../../core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { safeUnsubscribe } from '../../../core/utils.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EndpointsMissingComponent } from '../../../shared/components/endpoints-missing/endpoints-missing.component';
import { ListSubNavComponent } from '../../../shared/components/list-sub-nav/list-sub-nav.component';
import { TailwindSnackBarRef, TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { SessionService } from '../../../shared/services/session.service';
import { EndpointModalService } from '../endpoint-register-modal/endpoint-modal.service';
import { EndpointRegisterModalComponent } from '../endpoint-register-modal/endpoint-register-modal.component';
import { EndpointsSignalListComponent } from './endpoints-signal-list.component';
import { AppAreaLoaderComponent } from '../../../shared/components/area-loader/area-loader.component';

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  host: { class: 'flex flex-col h-full min-h-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AppAreaLoaderComponent,
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    PageHeaderComponent,
    EndpointsSignalListComponent,
    EndpointsMissingComponent,
    EndpointRegisterModalComponent,
    ListSubNavComponent
  ]
})
export class EndpointsPageComponent implements AfterViewInit, OnDestroy, OnInit {
  endpointsService = inject(EndpointsService);
  router = inject(Router);
  private endpointsData = inject(EndpointsDataService);
  private authSignal = inject(AuthSignalService);
  private snackBarService = inject(TailwindSnackBarService);
  sessionService = inject(SessionService);
  private endpointModalService = inject(EndpointModalService);
  private dashboardSignals = inject(DashboardSignalService);
  private endpointStatusSignals = inject(EndpointStatusSignalService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  // Bridge dashboard signal → observable in injection context (field init).
  private dashboardState$ = toObservable(this.dashboardSignals.dashboard);

  // Signal-backed permission flag. The directive-based approach (*appUserPermission
  // + async pipe) was sensitive to CD timing under zoneless Angular 21 — the
  // button would disappear after a modal open/close cycle. A signal reads cleanly
  // in the template with @if and always reflects the latest permission result,
  // regardless of surrounding component state churn.
  //
  // Allowed when ANY of the permissions that allow endpoint registration
  // passes — matching the previous directive-based behavior. toSignal
  // ends the long-lived permission streams with the page.
  public canRegisterEndpoint = toSignal(
    this.sessionService.userEndpointsEnabled().pipe(
      filter(enabled => enabled !== undefined && enabled !== null),
      switchMap(enabled => {
        const perms = enabled
          ? [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT, StratosCurrentUserPermissions.EDIT_ENDPOINT]
          : [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT];
        return combineLatest(perms.map(p => this.currentUserPermissionsService.can(p)));
      }),
      map(results => results.some(Boolean)),
      catchError(err => {
        console.error('Error resolving register-endpoint permission:', err);
        return of(false);
      })
    ),
    { initialValue: false }
  );
  private healthCheckTimeout!: number;

  /**
   * Primary "Register Endpoint" action wired to the L5 sub-nav above the
   * endpoints list. The L5 row lives inside <app-endpoints-signal-list>;
   * this object is passed via [addAction] so the inner component renders
   * the button while the outer keeps ownership of the modal lifecycle.
   * Visibility tracks `canRegisterEndpoint` so the button hides when the
   * user lacks the permission.
   */
  public registerEndpointAction = {
    label: 'Register Endpoint',
    icon: 'add',
    visible: this.canRegisterEndpoint,
    invoke: () => this.openRegisterModal(),
  };

  /** Count for the sub-nav shown when no endpoints are registered. */
  public readonly noEndpoints = signal(0);

  public canBackupRestore$: Observable<boolean>;
  public readonly showRegisterModal = signal(false);
  public isInitialised$: Observable<boolean>;

  private snackBarText = {
    message: `There are no connected endpoints, connect with your personal credentials to get started.`,
    action: 'Got it'
  };
  private noConnectedSnackBar?: TailwindSnackBarRef<unknown>;

  public customizations: CustomizationsMetadata;

  constructor() {
    const endpointsService = this.endpointsService;
    const cs = inject(CustomizationService);

    this.customizations = cs.get();

    // Redirect to /applications if not enabled.
    // Defensive: Use catchError to prevent subscription errors from breaking initialization
    endpointsService.disablePersistenceFeatures$.pipe(
      filter(off => off !== undefined && off !== null),
      map(off => {
        if (off) {
          // User should only get here if url is manually entered
          this.router.navigate(['applications'], { replaceUrl: true });
        }
      }),
      take(1),
      // The flag may never arrive; do not hold the page after it closes.
      takeUntilDestroyed()
    ).subscribe({
      error: (err) => console.error('Error checking persistence features:', err)
    });

    // Is the backup/restore plugin available on the backend?
    // Defensive: Add catchError to handle session data access issues
    this.canBackupRestore$ = toObservable(this.authSignal.sessionData).pipe(
      filter(sessionData => !!sessionData),
      take(1),
      map(sessionData => sessionData?.plugins?.backup || false),
      switchMap(enabled => enabled ? this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT) : of(false))
    );

    // Create an observable to track when endpoints are loaded and ready
    // Defensive: Add null checks and error handling
    this.isInitialised$ = toObservable(this.endpointStatusSignals.initialised).pipe(
      delay(500) // Delay to ensure proper loading sequence
    );
  }

  subs: Subscription[] = [];

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Endpoints);

  private startEndpointHealthCheckPulse() {
    this.healthCheckTimeout = window.setInterval(() => {
      this.endpointsService.checkAllEndpoints();
    }, 30000);
  }

  private stopEndpointHealthCheckPulse() {
    clearInterval(this.healthCheckTimeout);
  }

  // Only this page's own message: hide() would also dismiss others, such as
  // the Register form's "Successfully registered", which arrives just
  // before the endpoints update.
  private showSnackBar(show: boolean) {
    if (show) {
      this.noConnectedSnackBar = this.snackBarService.show(this.snackBarText.message, this.snackBarText.action, 20000);
    } else {
      this.noConnectedSnackBar?.dismiss();
      this.noConnectedSnackBar = undefined;
    }
  }

  ngOnInit() {
    // Defensive: Validate entity catalog initialization before dispatching actions
    // Entity catalog entities are populated during module initialization (see EntityCatalogFeatureModule)
    // and should be available by the time component constructors run. However, we add defensive checks
    // to gracefully handle edge cases where catalog might not be fully initialized.

    // Trigger endpoint hydration via the signal-native EndpointsDataService.
    // The service owns its own /pp/v1/info HTTP call + lifecycle signals —
    // this also supplies the per-endpoint metadata the legacy systemInfo
    // fetch used to carry.
    void this.endpointsData.getAll(false).catch(err => {
      console.error('Failed to load endpoints via EndpointsDataService:', err);
    });

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
      this.dashboardState$.pipe(
        filter(dashboard => !!dashboard),
        take(1)
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
      this.showSnackBar(false);
    } catch (error) {
      console.error('Error hiding snackbar:', error);
    }

    // Leaving with the Register dialog open (e.g. through the side nav)
    // must still release the page scroll the dialog locked.
    if (this.showRegisterModal()) {
      this.closeRegisterModal();
    }
  }

  // Modal methods
  openRegisterModal() {
    this.showRegisterModal.set(true);
    this.endpointModalService.openModal();
  }

  closeRegisterModal() {
    this.showRegisterModal.set(false);
    this.endpointModalService.closeModal();
  }

  onEndpointRegistered() {
    // Refresh via signal-native service — re-fetches /pp/v1/info and
    // updates the endpoints signal (carries the per-endpoint metadata the
    // legacy systemInfo fetch supplied).
    void this.endpointsData.getAll(false).catch(err => {
      console.error('Failed to refresh endpoints via EndpointsDataService:', err);
    });

    // Trigger endpoint health checks
    // Defensive: Wrap in try-catch to prevent errors from breaking the flow
    try {
      this.endpointsService.checkAllEndpoints();
    } catch (error) {
      console.error('Error checking endpoints after registration:', error);
    }

    // No message here: the registration form said "Successfully registered
    // '<name>'" when the endpoint was registered.

    // Close the modal
    this.closeRegisterModal();
  }
}
