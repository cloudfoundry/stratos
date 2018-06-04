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
import { IApp } from '../../../core/cf-api.types';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CFAppCLIInfoContext } from '../../../shared/components/cli-info/cli-info.component';

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
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public route$: Observable<{ url: string, queryParams: any }>;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.breadcrumbs$ = new BehaviorSubject<IHeaderBreadcrumb[]>([]);
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    const defaultBackLink = (
      `/applications/${cfGuid}/${appGuid}`
    );

    this.setupRouteObservable(defaultBackLink);
    // Will auto unsubscribe as we are using 'first'
    this.route$.pipe(first()).subscribe(route => {
      this.previousUrl = route.url;
      this.previousQueryParams = route.queryParams;
    });

    this.setupObservables(cfGuid);
    this.setupBreadcrumbs(cfGuid, appGuid);
  }

  private setupRouteObservable(defaultBackLink: string) {
    this.route$ = this.store.select(getPreviousRoutingState).pipe(
      map(route => {
        return {
          url: route && route.state ? route.state.url : defaultBackLink,
          queryParams: route && route.state.queryParams ? route.state.queryParams : {}
        };
      })
    );
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

  setupBreadcrumbs(cfGuid: string, appGuid: string) {
    this.breadcrumbs$ = combineLatest(
      this.route$,
      this.context$
    ).pipe(
      map(([route, context]) => {
        return [
          {
            breadcrumbs: [
              { value: 'Applications', routerLink: '/applications' },
              { value: context.appName, routerLink: route.url }
            ]
          }
        ];
      }));
  }

  back() {
    this.store.dispatch(new RouterNav({
      path: this.previousUrl,
      query: this.previousQueryParams
    }
    ));
  }

}
