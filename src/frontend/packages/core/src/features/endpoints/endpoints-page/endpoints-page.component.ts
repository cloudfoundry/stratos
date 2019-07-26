import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { EndpointOnlyAppState } from '../../../../../store/src/app-state';
import { selectDashboardState } from '../../../../../store/src/selectors/dashboard.selectors';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';
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
  constructor(public endpointsService: EndpointsService, public store: Store<EndpointOnlyAppState>, private ngZone: NgZone) {
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

  sub: Subscription;

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
    this.endpointsService.checkAllEndpoints();
    this.store.select(selectDashboardState).pipe(
      first()
    ).subscribe(dashboard => {
      if (dashboard.pollingEnabled) {
        this.startEndpointHealthCheckPulse();
      }
    });
    // Doesn't look like this is used (see connect-endpoint-dialog.component for actual handler)
    // const params = queryParamMap();
    // if (params.cnsi_guid) {
    //   const guid = params.cnsi_guid;
    //   window.history.pushState({}, '', '/endpoints');
    //   this.sub = this.endpointsService.endpoints$.pipe(
    //     delay(0),
    //     filter(ep => !!ep[guid]),
    //     map(ep => {
    //       const endpoint = ep[guid];
    //       if (endpoint.connectionStatus === 'connected') {
    //         this.store.dispatch(new ShowSnackBar(`Connected endpoint '${endpoint.name}'`));
    //       } else {
    //         this.store.dispatch(new ShowSnackBar(`A problem occurred connecting endpoint ${endpoint.name}`));
    //       }
    //     }),
    //     first(),
    //   ).subscribe();
    // }
  }

  ngOnDestroy() {
    this.stopEndpointHealthCheckPulse();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}


