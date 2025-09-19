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
import { EndpointOnlyAppState, RouterNav, selectDashboardState, selectSessionData, stratosEntityCatalog, endpointStatusSelector } from '@stratosui/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { delay, first, map, switchMap, tap } from 'rxjs/operators';

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
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { SessionService } from '../../../shared/services/session.service';
import { EndpointModalService } from '../endpoint-register-modal/endpoint-modal.service';

@Component({
selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }, EndpointListHelper],
  standalone: false
})
export class EndpointsPageComponent implements AfterViewInit, OnDestroy, OnInit {
  public canRegisterEndpoint: Observable<StratosCurrentUserPermissions[]>;
  private healthCheckTimeout: number;

  public canBackupRestore$: Observable<boolean>;
  public showRegisterModal = false;
  public isInitialised$: Observable<boolean>;

  @ViewChild('customNoEndpoints', { read: ViewContainerRef, static: true }) customNoEndpointsContainer;
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

    this.canRegisterEndpoint = this.sessionService.userEndpointsEnabled().pipe(
      map(enabled => {
        if (enabled){
          return [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT, StratosCurrentUserPermissions.EDIT_ENDPOINT];
        }else{
          return [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT];
        }
      })
    );

    // Is the backup/restore plugin available on the backend?
    this.canBackupRestore$ = this.store.select(selectSessionData()).pipe(
      first(),
      map(sessionData => sessionData?.plugins.backup),
      switchMap(enabled => enabled ? currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT) : of(false))
    );

    // Create an observable to track when endpoints are loaded and ready
    this.isInitialised$ = this.store.select(endpointStatusSelector).pipe(
      map(endpointState => !endpointState.loading),
      delay(100) // Small delay to ensure data is properly loaded
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
    // Fetch endpoints list on page load
    console.log('Endpoints page loaded - fetching endpoints list');
    
    // Dispatch the GET_ENDPOINTS action which triggers system info fetch
    this.store.dispatch(stratosEntityCatalog.endpoint.actions.getAll());
    console.log('Dispatched GET_ENDPOINTS action');
    
    // Also explicitly trigger system info
    this.store.dispatch(stratosEntityCatalog.systemInfo.actions.getSystemInfo());
    console.log('Dispatched system info action');

    this.subs.push(this.endpointsService.haveRegistered$.subscribe(haveRegistered => {
      console.log('haveRegistered changed:', haveRegistered);
      // Use custom component if specified
      this.customNoEndpointsContainer.clear();
      if (!haveRegistered && this.customizations.noEndpointsComponent) {
        const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this.customizations.noEndpointsComponent);
        this.customContentComponentRef = this.customNoEndpointsContainer.createComponent(factory);
      }
    }));

    // Debug: Also subscribe to the actual endpoints data to see what's there
    this.subs.push(this.endpointsService.endpoints$.subscribe(endpoints => {
      console.log('Endpoints in store:', endpoints);
      console.log('Number of endpoints:', Object.keys(endpoints).length);
    }));

    // Debug: Check what the list data source is doing
    // We need to get access to the list component somehow to debug its data source
    setTimeout(() => {
      console.log('Checking if we can access list component data source...');
      if (this.listComponent) {
        console.log('List component found:', this.listComponent);
        console.log('Data source:', this.listComponent.dataSource);
        if (this.listComponent.dataSource) {
          this.listComponent.dataSource.page$.subscribe(page => {
            console.log('Data source page$:', page);
          });
          this.listComponent.dataSource.pagination$.subscribe(pagination => {
            console.log('Data source pagination$:', pagination);
          });
          
          // Debug the specific observables that control hasRows$
          this.listComponent.dataSource.maxedResults$.subscribe(maxedResults => {
            console.log('Data source maxedResults$:', maxedResults);
          });
          
          // Debug hasRows$ directly from the list component
          this.listComponent.hasRows$.subscribe(hasRows => {
            console.log('List component hasRows$:', hasRows);
          });
          
          // Debug the view type and card component
          this.listComponent.view$.subscribe(view => {
            console.log('List component view$:', view);
          });
          
          console.log('List config cardComponent:', this.listComponent.config.cardComponent);
        }
      } else {
        console.log('List component not found');
      }
    }, 2000);

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
    console.log('ngAfterViewInit - checking if list component is rendered');
    
    this.subs.push(combineLatest(
      this.endpointsService.haveRegistered$,
      this.endpointsService.haveConnected$,
    ).pipe(
      delay(1),
      tap(([hasRegistered, hasConnected]) => {
        console.log('hasRegistered:', hasRegistered, 'hasConnected:', hasConnected);
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
    console.log('onEndpointRegistered called - refreshing endpoints');
    
    // Dispatch the GET_ENDPOINTS action to refresh the list
    this.store.dispatch(stratosEntityCatalog.endpoint.actions.getAll());
    console.log('Dispatched GET_ENDPOINTS action after registration');
    
    // Also trigger system info refresh to update overall state
    this.store.dispatch(stratosEntityCatalog.systemInfo.actions.getSystemInfo());
    console.log('Dispatched system info action after registration');
    
    // Also trigger health checks
    this.endpointsService.checkAllEndpoints();
    
    // Show success message
    this.snackBarService.show('Endpoint registered successfully!', 'OK', 5000);
    
    // Close the modal
    this.closeRegisterModal();
  }
}
