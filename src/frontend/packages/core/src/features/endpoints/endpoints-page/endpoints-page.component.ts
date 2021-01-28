import {
  AfterViewInit,
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
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { delay, first, map, switchMap, tap } from 'rxjs/operators';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { EndpointOnlyAppState } from '../../../../../store/src/app-state';
import { selectSessionData } from '../../../../../store/src/reducers/auth.reducer';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
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
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { SessionService } from '../../../shared/services/session.service';

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }, EndpointListHelper]
})
export class EndpointsPageComponent implements AfterViewInit, OnDestroy, OnInit {
  public canRegisterEndpoint = [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT];
  private healthCheckTimeout: number;

  public canBackupRestore$: Observable<boolean>;

  @ViewChild('customNoEndpoints', { read: ViewContainerRef, static: true }) customNoEndpointsContainer;
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
    public sessionService: SessionService
  ) {
    this.customizations = cs.get();

    // Redirect to /applications if not enabled.
    endpointsService.disablePersistenceFeatures$.pipe(
      map(off => {
        if (off) {
          // User should only get here if url is manually entered
          this.store.dispatch(new RouterNav({
            path: ['applications'],
            extras: {
              replaceUrl: true
            }
          }));
        }
      }),
      first()
    ).subscribe();

    // Is the backup/restore plugin available on the backend?
    this.canBackupRestore$ = this.store.select(selectSessionData()).pipe(
      first(),
      map(sessionData => sessionData?.plugins.backup),
      switchMap(enabled => enabled ? currentUserPermissionsService.can(this.canRegisterEndpoint[0]) : of(false))
    );

    this.sessionService.userEndpointsEnabled().subscribe(enabled => {
      if(enabled) this.canRegisterEndpoint.push(StratosCurrentUserPermissions.EDIT_ENDPOINT);
    });
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
    this.subs.push(this.endpointsService.haveRegistered$.subscribe(haveRegistered => {
      // Use custom component if specified
      this.customNoEndpointsContainer.clear();
      if (!haveRegistered && this.customizations.noEndpointsComponent) {
        const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this.customizations.noEndpointsComponent);
        this.customContentComponentRef = this.customNoEndpointsContainer.createComponent(factory);
      }
    }));

    this.endpointsService.checkAllEndpoints();
    this.store.select(selectDashboardState).pipe(
      first()
    ).subscribe(dashboard => {
      if (dashboard.pollingEnabled) {
        this.startEndpointHealthCheckPulse();
      }
    });
  }

  ngAfterViewInit() {
    this.subs.push(combineLatest(
      this.endpointsService.haveRegistered$,
      this.endpointsService.haveConnected$,
    ).pipe(
      delay(1),
      tap(([hasRegistered, hasConnected]) => {
        this.showSnackBar(hasRegistered && !hasConnected);
      }),
    ).subscribe());
  }

  ngOnDestroy() {
    this.stopEndpointHealthCheckPulse();
    safeUnsubscribe(...this.subs);
    if (this.customContentComponentRef) {
      this.customContentComponentRef.destroy();
    }
    this.showSnackBar(false);
  }
}
