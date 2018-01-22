import { RouterNav } from '../../../../store/actions/router.actions';
import { AssociateRouteWithAppApplication } from '../../../../store/actions/application.actions';
import { CreateRoute, NewRoute, RouteSchema } from '../../../../store/actions/route.actions';
import { AppState } from '../../../../store/app-state';
import {
    selectEntity,
    selectNestedEntity,
    selectRequestInfo,
} from '../../../../store/selectors/api.selectors';
import { ApplicationService } from '../../application.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { tap, map, filter, delay, mergeMap, distinct, catchError } from 'rxjs/operators';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { Route } from '../../../../store/types/route.types';
import { Domain } from '../../../../store/types/domain.types';
import { MatSnackBar } from '@angular/material';
import { isDebuggerStatement } from 'typescript';

@Component({
  selector: 'app-add-routes',
  templateUrl: './add-routes.component.html',
  styleUrls: ['./add-routes.component.scss']
})
export class AddRoutesComponent implements OnInit, OnDestroy {

  submitted: boolean;
  model: Route;
  domains: APIResource<Domain>[] = [];
  addTCPRoute: FormGroup;
  addHTTPRoute: FormGroup;
  domains$: Subscription;
  space$: Subscription;
  associateRoute$: Subscription;
  appGuid: string;
  cfGuid: string;
  spaceGuid: string;
  createTCPRoute = false;
  selectedDomain: APIResource<any>;

  constructor(
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar
  ) {
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
   }

  appService = this.applicationService;

  ngOnInit() {
    this.addHTTPRoute = new FormGroup({
      host: new FormControl('', [<any>Validators.required]),
      domain: new FormControl('', [<any>Validators.required]),
      path: new FormControl('')
    });

    this.addTCPRoute = new FormGroup({
      domain: new FormControl('', [<any>Validators.required]),
      port: new FormControl('', [Validators.required, Validators.pattern('[0-9]*')])
    });

    this.space$ = this.store.select(selectEntity('application', this.appGuid))
    .pipe(
      filter(p => !!p),
      tap(p => {
        this.spaceGuid = p.entity.space_guid;
        if (this.domains$) {
          this.domains$.unsubscribe();
        }
        this.domains$ = this.store.select(selectNestedEntity('space', this.spaceGuid, ['entity', 'domains']))
        .pipe(
          filter(d => !!d),
          tap(d => {
            d.forEach(domain => {
              this.domains[domain.metadata.guid] = domain;
            });
            this.selectedDomain = Object.values(this.domains)[0];
          })
        ).subscribe();
      })
    ).subscribe();

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

  onSubmit(routeType) {
    this.submitted = true;
    const formGroup = routeType === 'tcp' ? this.addTCPRoute : this.addHTTPRoute;

    const newRouteGuid =  this._getValueForKey('host', formGroup) +  this._getValueForKey('port', formGroup) +
    this._getValueForKey('path', formGroup) + formGroup.value.domain.metadata.guid;

    this.store.dispatch(new CreateRoute(
      newRouteGuid,
      this.cfGuid,
      new Route(
        formGroup.value.domain.metadata.guid,
        this.spaceGuid,
        this._getValue('host', formGroup),
        this._getValue('path', formGroup),
        this._getValue('port', formGroup)
      )
    ));
    this.associateRoute$ = this.store.select(selectRequestInfo(RouteSchema.key, newRouteGuid))
    .pipe(
      filter(route => !route.creating),
      map(route => {
        if (route.error) {
          this.submitted = false;
          if (this.createTCPRoute) {
            this.snackBar.open('Failed to create route! Please ensure the domain has a TCP routing group associated', 'Dismiss');
          } else {
            this.snackBar
            .open('Failed to create route! The hostname may have been taken, please try again with a different name', 'Dismiss');
          }
        } else {
          const routeAssignAction = new AssociateRouteWithAppApplication(
            this.appGuid,
            route.response.result[0],
            this.cfGuid
          );
          this.store.dispatch(routeAssignAction);
          this.submitted = false;
          this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid] }));
         }
      })
    ).subscribe();
  }

  toggleCreateTCPRoute() {
    this.createTCPRoute = !this.createTCPRoute;
  }
  ngOnDestroy(): void {
    if (this.domains$) {
      this.domains$.unsubscribe();
    }
    this.space$.unsubscribe();
    if (this.associateRoute$) {
      this.associateRoute$.unsubscribe();
    }
  }
}
