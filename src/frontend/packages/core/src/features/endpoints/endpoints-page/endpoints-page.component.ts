import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { delay, filter, first, map } from 'rxjs/operators';

import { ShowSnackBar } from '../../../../../store/src/actions/snackBar.actions';
import { AppState } from '../../../../../store/src/app-state';
import { queryParamMap } from '../../../core/auth-guard.service';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { EndpointListHelper } from '../../../shared/components/list/list-types/endpoint/endpoint-list.helpers';

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
  constructor(public endpointsService: EndpointsService, public store: Store<AppState>, private ngZone: NgZone) { }

  sub: Subscription;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Endpoints);

  private startEndpointHealthCheckPulse() {
    this.endpointsService.checkAllEndpoints();
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
    this.startEndpointHealthCheckPulse();
    const params = queryParamMap();
    if (params.cnsi_guid) {
      const guid = params.cnsi_guid;
      window.history.pushState({}, '', '/endpoints');
      this.sub = this.endpointsService.endpoints$.pipe(
        delay(0),
        filter(ep => !!ep[guid]),
        map(ep => {
          const endpoint = ep[guid];
          if (endpoint.connectionStatus === 'connected') {
            this.store.dispatch(new ShowSnackBar(`Connected endpoint '${endpoint.name}'`));
          } else {
            this.store.dispatch(new ShowSnackBar(`A problem occurred connecting endpoint ${endpoint.name}`));
          }
        }),
        first(),
      ).subscribe();
    }
  }

  ngOnDestroy() {
    this.stopEndpointHealthCheckPulse();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}


