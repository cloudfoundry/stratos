import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';
import { safeUnsubscribe } from '../../../core/utils.service';
import { EndpointListHelper } from '../../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }, EndpointListHelper]
})
export class EndpointsPageComponent implements OnDestroy, OnInit {
  public canRegisterEndpoint = CurrentUserPermissions.ENDPOINT_REGISTER;
  private healthCheckTimeout: number;

  @ViewChild('customNoEndpoints', { read: ViewContainerRef }) customNoEndpointsContainer;
  customContentComponentRef: ComponentRef<any>;

  constructor(
    public endpointsService: EndpointsService,
    public store: Store<AppState>,
    private ngZone: NgZone,
    private resolver: ComponentFactoryResolver,
    @Inject(Customizations) public customizations: CustomizationsMetadata
  ) {
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

  sub: Subscription[] = [];

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

  ngOnInit() {
    this.sub.push(this.endpointsService.haveRegistered$.subscribe(haveRegistered => {
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

  ngOnDestroy() {
    this.stopEndpointHealthCheckPulse();
    safeUnsubscribe(...this.sub);
    if (this.customContentComponentRef) {
      this.customContentComponentRef.destroy();
    }

  }
}


