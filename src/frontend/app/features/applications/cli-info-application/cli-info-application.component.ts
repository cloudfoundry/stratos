import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApplicationService } from '../application.service';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { getPreviousRoutingState, RoutingEvent } from '../../../store/types/routing.type';
import { first, map, filter } from 'rxjs/operators';
import { RouterNav } from '../../../store/actions/router.actions';
import { ActivatedRoute } from '@angular/router';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { APIResource } from '../../../store/types/api.types';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { getFullEndpointApiUrl } from '../../endpoints/endpoint-helpers';
import { Observable } from 'rxjs/Observable';

// Context used in the CLI Info template
interface CFAppCLIInfoContext {
  appName: string;
  spaceName: string;
  orgName: string;
  apiEndpoint: string;
  username: string;
}

@Component({
  selector: 'app-cli-info-application',
  templateUrl: './cli-info-application.component.html',
  styleUrls: ['./cli-info-application.component.scss'],
})
export class CliInfoApplicationComponent implements OnInit {

  cfEndpointEntityService: any;
  public previousUrl: string;
  public previousQueryParams: {
    [key: string]: string;
  };

  public context$: Observable<CFAppCLIInfoContext>;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory
  ) { }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    const defaultBackLink = (
      `/applications/${cfGuid}/${appGuid}`
    );

    // Will auto unsubscribe as we are using 'first'
    this.store.select(getPreviousRoutingState).pipe(first()).subscribe(route => {
      this.previousUrl = route && route.state ? route.state.url : defaultBackLink;
      this.previousQueryParams = route && route.state.queryParams ? route.state.queryParams : {};
    });

    this.setupObservables(cfGuid);
  }

  private setupObservables(cfGuid: string) {
    this.cfEndpointEntityService = this.entityServiceFactory.create(
      endpointSchemaKey,
      entityFactory(endpointSchemaKey),
      cfGuid,
      new GetAllEndpoints(),
      false
    );

    this.context$ = combineLatest(
      this.applicationService.application$,
      this.cfEndpointEntityService.waitForEntity$
    ).pipe(
      filter(([app, ep]) => !!app && !!ep),
      map(([app, ep]) => {
        return {
          appName: app.app.entity.name,
          spaceName: app.app.entity.space.entity.name,
          orgName: app.app.entity.space.entity.organization.entity.name,
          apiEndpoint: getFullEndpointApiUrl(ep.entity),
          username: ep.entity.user ? ep.entity.user.name : ''
        };
      }),
      first()
    );
  }

  back() {
    this.store.dispatch(new RouterNav({
      path: this.previousUrl,
      query: this.previousQueryParams }
    ));
  }

}
