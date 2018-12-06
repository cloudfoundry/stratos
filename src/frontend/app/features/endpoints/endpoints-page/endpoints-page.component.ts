import { Component, OnDestroy, OnInit } from '@angular/core';

import { EndpointsService } from '../../../core/endpoints.service';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { Subscription, } from 'rxjs';
import { queryParamMap } from '../../../core/auth-guard.service';
import { delay, first, map, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ShowSnackBar } from '../../../store/actions/snackBar.actions';
import { StratosActionType, getActionsFromExtensions, StratosActionMetadata } from '../../../core/extension/extension-service';

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }]
})

export class EndpointsPageComponent implements OnDestroy, OnInit {
  public canRegisterEndpoint = CurrentUserPermissions.ENDPOINT_REGISTER;
  constructor(public endpointsService: EndpointsService, public store: Store<AppState>) { }

  sub: Subscription;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Endpoints);

  ngOnInit(): void {
    const params = queryParamMap();
    if (params['cnsi_guid']) {
      const guid = params['cnsi_guid'];
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
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}


