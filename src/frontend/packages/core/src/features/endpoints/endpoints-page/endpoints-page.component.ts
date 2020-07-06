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
import { combineLatest, Subscription } from 'rxjs';
import { delay, first, map, tap } from 'rxjs/operators';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { EndpointOnlyAppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { safeUnsubscribe } from '../../../core/utils.service';
import { EndpointListHelper } from '../../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { SnackBarService } from '../../../shared/services/snackbar.service';

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
  public canRegisterEndpoint = StratosCurrentUserPermissions.ENDPOINT_REGISTER;
  private healthCheckTimeout: number;

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
    cs: CustomizationService
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
