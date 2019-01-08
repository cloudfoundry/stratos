import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, mergeMap, pairwise, switchMap, take, tap } from 'rxjs/operators';

import { IDomain, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { pathGet } from '../../../../core/utils.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import {
  AssociateRouteWithAppApplication,
  GetAppRoutes,
} from '../../../../store/actions/application-service-routes.actions';
import { FetchAllDomains } from '../../../../store/actions/domains.actions';
import { CreateRoute } from '../../../../store/actions/route.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { GetSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import {
  applicationSchemaKey,
  domainSchemaKey,
  entityFactory,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations/entity-relations.types';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { Route, RouteMode } from '../../../../store/types/route.types';
import { ApplicationService } from '../../application.service';

const hostPattern = '^([\\w\\-\\.]*)$';
const pathPattern = `^([\\w\\-\\/\\!\\#\\[\\]\\@\\&\\$\\'\\(\\)\\*\\+\\;\\=\\,]*)$`;
@Component({
  selector: 'app-add-routes',
  templateUrl: './add-routes.component.html',
  styleUrls: ['./add-routes.component.scss']
})
export class AddRoutesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  model: Route;
  domains: APIResource<IDomain>[] = [];
  addTCPRoute: FormGroup;
  addHTTPRoute: FormGroup;
  domainFormGroup: FormGroup;
  appGuid: string;
  cfGuid: string;
  spaceGuid: string;
  createTCPRoute = false;
  selectedDomain: APIResource<any>;
  selectedRoute$ = new BehaviorSubject<any>({
    entity: {},
    metadata: {}
  });
  appUrl: string;
  isRouteSelected$ = new BehaviorSubject<boolean>(false);
  addRouteModes: RouteMode[] = [
    { id: 'create', label: 'Create and map new route', submitLabel: 'Create' },
    { id: 'map', label: 'Map existing route', submitLabel: 'Map' }
  ];
  addRouteMode: RouteMode;
  useRandomPort = false;
  constructor(
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
    this.appUrl = `/applications/${this.cfGuid}/${this.appGuid}/routes`;
    this.addRouteMode = this.addRouteModes[0];
    this.domainFormGroup = new FormGroup({
      domain: new FormControl('', [<any>Validators.required])
    });

    this.addHTTPRoute = new FormGroup({
      host: new FormControl('', [<any>Validators.required, Validators.pattern(hostPattern), Validators.maxLength(63)]),
      path: new FormControl('', [Validators.pattern(pathPattern), Validators.maxLength(128)])
    });

    this.addTCPRoute = new FormGroup({
      port: new FormControl('', [
        Validators.required,
        Validators.pattern('[0-9]*')
      ]),
      useRandomPort: new FormControl(false)
    });
  }

  appService = this.applicationService;

  ngOnInit() {
    this.subscriptions.push(this.addTCPRoute.valueChanges.subscribe(val => {
      const useRandomPort = val['useRandomPort'];
      if (useRandomPort !== this.useRandomPort) {
        this.useRandomPort = useRandomPort;
        const validators = [
          Validators.required,
          Validators.pattern('[0-9]*'),
        ];
        this.addTCPRoute.controls['port'].setValidators(useRandomPort ? [] : validators);
        if (useRandomPort) {
          this.addTCPRoute.controls['port'].disable();
        } else {
          this.addTCPRoute.controls['port'].enable();
        }
      }
    }));

    const fetchAllDomainsAction = new FetchAllDomains(this.cfGuid);
    const sharedDomains$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action: fetchAllDomainsAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          fetchAllDomainsAction.paginationKey,
          entityFactory(domainSchemaKey)
        )
      },
      true
    ).entities$;

    const space$ = sharedDomains$.pipe(
      // We don't need the shared domains, but we need them fetched first so we get the router_group_type
      switchMap(sharedDomains => this.appService.waitForAppEntity$
        .pipe(
          switchMap(app => {
            this.spaceGuid = app.entity.entity.space_guid;
            const spaceService = this.entityServiceFactory.create<APIResource<ISpace>>(spaceSchemaKey,
              entityFactory(spaceSchemaKey),
              this.spaceGuid,
              new GetSpace(this.spaceGuid, this.cfGuid, [createEntityRelationKey(spaceSchemaKey, domainSchemaKey)]),
              true
            );
            return spaceService.waitForEntity$;
          }),
          filter(({ entity, entityRequestInfo }) => !!entity.entity.domains),
          tap(({ entity, entityRequestInfo }) => {
            this.domains = [];
            const domains = entity.entity.domains;
            domains.forEach(domain => {
              this.domains.push(domain);
            });
            this.selectedDomain = Object.values(this.domains)[0];
          })
        )
      ));

    this.subscriptions.push(space$.subscribe());

    const selRoute$ = this.selectedRoute$.subscribe(x => {
      if (x.metadata.guid) {
        this.isRouteSelected$.next(true);
      }
    });
    this.subscriptions.push(selRoute$);
  }

  _getValueForKey(key, form) {
    return form.value[key] ? form.value[key] : '';
  }

  _getValue(key, form) {
    return form.value[key] !== '' ? form.value[key] : null;
  }

  validate(): boolean {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      return this.isTCPRouteCreation()
        ? this.addTCPRoute.valid
        : this.addHTTPRoute.valid;
    } else {
      try {
        return this.isRouteSelected$.getValue();
      } catch (e) { }

      return false;
    }
  }

  isTCPRouteCreation(): boolean {
    return this.domainFormGroup.value['domain'] && this.domainFormGroup.value['domain'].entity.router_group_type === 'tcp';
  }

  submit: StepOnNextFunction = () => {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      // Creating new route
      return this.onSubmit();
    } else {
      return this.mapRouteSubmit();
    }
  }

  onSubmit(): Observable<StepOnNextResult> {
    const domainGuid = this.domainFormGroup.value['domain'].metadata.guid;
    const isTcpRoute = this.isTCPRouteCreation();
    const formGroup = isTcpRoute ? this.addTCPRoute : this.addHTTPRoute;

    // Set port to -1 to indicate that we should generate a random port number
    let port = this._getValue('port', formGroup);
    if (isTcpRoute && formGroup.value['useRandomPort']) {
      port = -1;
    }

    const newRouteGuid =
      isTcpRoute ? 'tcp_' : 'http_' +
        this._getValueForKey('host', formGroup) +
        this._getValueForKey('port', formGroup) +
        this._getValueForKey('path', formGroup) +
        domainGuid;

    return this.createAndMapRoute(
      newRouteGuid,
      domainGuid,
      this._getValue('host', formGroup),
      this._getValue('path', formGroup),
      port,
      isTcpRoute
    );
  }

  private createAndMapRoute(
    newRouteGuid: string,
    domainGuid: string,
    host: string,
    path: string,
    port: number,
    isTCP: boolean): Observable<StepOnNextResult> {
    if (path && path.length && path[0] !== '/') {
      path = '/' + path;
    }

    this.store.dispatch(new CreateRoute(newRouteGuid, this.cfGuid, new Route(domainGuid, this.spaceGuid, host, path, port)));
    return this.store.select(selectRequestInfo(routeSchemaKey, newRouteGuid))
      .pipe(
        filter(route => !route.creating && !route.fetching),
        mergeMap(route => {
          if (route.error) {
            return observableOf({ success: false, message: `Failed to create route: ${route.message}` });
          } else {
            return this.mapRoute(route.response.result[0]);
          }
        })
      );
  }

  private mapRoute(routeGuid: string): Observable<StepOnNextResult> {
    this.store.dispatch(new AssociateRouteWithAppApplication(this.appGuid, routeGuid, this.cfGuid));
    return this.store.select(selectRequestInfo(applicationSchemaKey, this.appGuid)).pipe(
      pairwise(),
      filter(([oldApp, newApp]) => {
        return pathGet('updating.Assigning-Route.busy', oldApp) && !pathGet('updating.Assigning-Route.busy', newApp);
      }),
      map(([oldApp, newApp]) => newApp),
      map((requestState: RequestInfoState) => {
        if (requestState.error) {
          return { success: false, message: `Failed to associate route with app: ${requestState.error}` };
        }
        this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid, 'routes'] }));
        return { success: true };
      })
    );
  }

  private mapRouteSubmit(): Observable<StepOnNextResult> {
    return this.selectedRoute$.pipe(
      tap(route => this.store.dispatch(new AssociateRouteWithAppApplication(this.appGuid, route.metadata.guid, this.cfGuid))),
      switchMap(() => this.appService.app$),
      map(requestInfo => requestInfo.entityRequestInfo.updating['Assigning-Route']),
      filter(requestInfo => !requestInfo.busy),
      take(1),
      map(requestInfo => {
        if (requestInfo.error) {
          return { success: false, message: `Failed to associate route with app: ${requestInfo.message}` };
        } else {
          this.store.dispatch(new GetAppRoutes(this.appGuid, this.cfGuid));
          return { success: true, redirect: true };
        }
      })
    );
  }

  toggleCreateTCPRoute() {
    this.createTCPRoute = !this.createTCPRoute;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
