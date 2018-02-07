import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter, map, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { AssociateRouteWithAppApplication } from '../../../../store/actions/application.actions';
import {
  CreateRoute,
  GetAppRoutes,
  RouteSchema
} from '../../../../store/actions/route.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import {
  selectEntity,
  selectNestedEntity,
  selectRequestInfo
} from '../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { Domain } from '../../../../store/types/domain.types';
import { Route, RouteMode } from '../../../../store/types/route.types';
import { ApplicationService } from '../../application.service';
import { Observable } from 'rxjs/Observable';

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
  domains$: Subscription;
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
    private snackBar: MatSnackBar
  ) {
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
    this.appUrl = `/applications/${this.cfGuid}/${this.appGuid}/summary`;
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

    const space$ = this.store
      .select(selectEntity('application', this.appGuid))
      .pipe(
        filter(p => !!p),
        tap(p => {
          this.spaceGuid = p.entity.space_guid;
          if (this.domains$) {
            this.domains$.unsubscribe();
          }
          this.domains$ = this.store
            .select(
              selectNestedEntity('space', this.spaceGuid, ['entity', 'domains'])
            )
            .pipe(
              filter(d => !!d),
              tap(d => {
                d.forEach(domain => {
                  this.domains[domain.metadata.guid] = domain;
                });
                this.selectedDomain = Object.values(this.domains)[0];
              })
            )
            .subscribe();
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
      } catch (e) {}

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
    const associateRoute$ = this.store
      .select(selectRequestInfo(RouteSchema.key, newRouteGuid))
      .pipe(
        filter(route => !route.creating),
        map(route => {
          if (route.error) {
            this.submitted = false;
            this.displaySnackBar();
          } else {
            const routeAssignAction = new AssociateRouteWithAppApplication(
              this.appGuid,
              route.response.result[0],
              this.cfGuid
            );
            this.store.dispatch(routeAssignAction);
            this.submitted = false;
            this.store.dispatch(
              new RouterNav({
                path: ['/applications', this.cfGuid, this.appGuid]
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
      this.snackBar.open(
        'Failed to create route! Please ensure the domain has a TCP routing group associated',
        'Dismiss'
      );
    } else {
      this.snackBar.open(
        'Failed to create route! The hostname may have been taken, please try again with a different name',
        'Dismiss'
      );
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
            this.snackBar.open(
              'Failed to associate route with the app!',
              'Dismiss'
            );
          } else {
            this.store.dispatch(new GetAppRoutes(this.appGuid, this.cfGuid));
            this.store.dispatch(
              new RouterNav({
                path: ['applications', this.cfGuid, this.appGuid]
              })
            );
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
    if (this.domains$) {
      this.domains$.unsubscribe();
    }

    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
