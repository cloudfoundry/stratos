import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, map, mergeMap, pairwise, switchMap, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { pathGet } from '../../../../core/utils.service';
import { AssociateRouteWithAppApplication, GetAppRoutes } from '../../../../store/actions/application-service-routes.actions';
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
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { Domain } from '../../../../store/types/domain.types';
import { Route, RouteMode } from '../../../../store/types/route.types';
import { ApplicationService } from '../../application.service';

@Component({
  selector: 'app-add-routes',
  templateUrl: './add-routes.component.html',
  styleUrls: ['./add-routes.component.scss']
})
export class AddRoutesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  submitted: boolean;
  model: Route;
  domains: APIResource<Domain>[] = [];
  addTCPRoute: FormGroup;
  addHTTPRoute: FormGroup;
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
    { id: 'create', label: 'Create and map new route' },
    { id: 'map', label: 'Map existing route' }
  ];
  addRouteMode: RouteMode;
  constructor(
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
    this.appUrl = `/applications/${this.cfGuid}/${this.appGuid}/routes`;
  }

  appService = this.applicationService;

  ngOnInit() {
    this.addHTTPRoute = new FormGroup({
      host: new FormControl('', [<any>Validators.required]),
      domain: new FormControl('', [<any>Validators.required]),
      path: new FormControl('')
    });
    this.addRouteMode = this.addRouteModes[0];

    this.addTCPRoute = new FormGroup({
      domain: new FormControl('', [<any>Validators.required]),
      port: new FormControl('', [
        Validators.required,
        Validators.pattern('[0-9]*')
      ])
    });

    const space$ = this.appService.waitForAppEntity$
      .pipe(
      switchMap(app => {
        const space = app.entity.entity.space as APIResource<ISpace>;
        this.spaceGuid = space.metadata.guid;
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
        const domains = entity.entity.domains;
        domains.forEach(domain => {
          this.domains[domain.metadata.guid] = domain;
        });
        this.selectedDomain = Object.values(this.domains)[0];
      })
      );
    this.subscriptions.push(space$.subscribe());

    const selRoute$ = this.selectedRoute$.subscribe(x => {
      if (x.metadata.guid) {
        this.isRouteSelected$.next(true);
      }
    });
    this.subscriptions.push(selRoute$);
  }

  getDomainValues() {
    return Object.values(this.domains);
  }
  _getValueForKey(key, form) {
    return form.value[key] ? form.value[key] : '';
  }

  _getValue(key, form) {
    return form.value[key] !== '' ? form.value[key] : null;
  }

  validate(): boolean {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      return this.createTCPRoute
        ? this.addTCPRoute.valid
        : this.addHTTPRoute.valid;
    } else {
      try {
        return this.isRouteSelected$.getValue();
      } catch (e) { }

      return false;
    }
  }

  submit = () => {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      // Creating new route
      return this.createTCPRoute ? this.onSubmit('tcp') : this.onSubmit('http');
    } else {
      return this.mapRouteSubmit();
    }
  }

  onSubmit(routeType) {
    this.submitted = true;
    const formGroup =
      routeType === 'tcp' ? this.addTCPRoute : this.addHTTPRoute;

    const newRouteGuid =
      this._getValueForKey('host', formGroup) +
      this._getValueForKey('port', formGroup) +
      this._getValueForKey('path', formGroup) +
      formGroup.value.domain.metadata.guid;

    this.store.dispatch(
      new CreateRoute(
        newRouteGuid,
        this.cfGuid,
        new Route(
          formGroup.value.domain.metadata.guid,
          this.spaceGuid,
          this._getValue('host', formGroup),
          this._getValue('path', formGroup),
          this._getValue('port', formGroup)
        )
      )
    );
    const associateRoute$ = this.store.select(selectRequestInfo(routeSchemaKey, newRouteGuid))
      .pipe(
      filter(route => !route.creating && !route.fetching),
      mergeMap(route => {
        if (route.error) {
          this.submitted = false;
          this.displaySnackBar();
          return Observable.of(null);
        } else {
          this.store.dispatch(new AssociateRouteWithAppApplication(
            this.appGuid,
            route.response.result[0],
            this.cfGuid
          ));
          return this.store.select(selectRequestInfo(applicationSchemaKey, this.appGuid)).pipe(
            pairwise(),
            filter(([oldApp, newApp]) => {
              return pathGet('updating.Assigning-Route.busy', oldApp) && !pathGet('updating.Assigning-Route.busy', newApp);
            }),
            tap(appState => {
              this.submitted = false;
              this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid, 'routes'] }));
            })
          );
        }
      })
      );

    this.subscriptions.push(associateRoute$.subscribe());
    return Observable.of({ success: true });
  }

  private displaySnackBar() {
    if (this.createTCPRoute) {
      this.snackBar.open('Failed to create route! Please ensure the domain has a TCP routing group associated', 'Dismiss');
    } else {
      this.snackBar.open('Failed to create route! The hostname may have been taken, please try again with a different name', 'Dismiss');
    }
  }

  mapRouteSubmit() {
    this.selectedRoute$.subscribe(route => {
      this.associateRoute(route);
      const appServiceSub$ = this.appService.app$.pipe(
        map(p => p.entityRequestInfo.updating['Assigning-Route']),
        filter(p => !p.busy),
        take(1),
        tap(p => {
          if (p.error) {
            this.snackBar.open('Failed to associate route with the app!', 'Dismiss');
          } else {
            this.store.dispatch(new GetAppRoutes(this.appGuid, this.cfGuid,
              createEntityRelationKey(applicationSchemaKey, domainSchemaKey)
            ));
            this.store.dispatch(new RouterNav({
              path: ['applications', this.cfGuid, this.appGuid, 'routes']
            }));
          }
        })
      );

      this.subscriptions.push(appServiceSub$.subscribe());
    });
    return Observable.of({ success: true });
  }

  private associateRoute(route: any) {
    this.store.dispatch(
      new AssociateRouteWithAppApplication(
        this.appGuid,
        route.metadata.guid,
        this.cfGuid
      )
    );
  }

  toggleCreateTCPRoute() {
    this.createTCPRoute = !this.createTCPRoute;
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
