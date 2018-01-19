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
import { tap, map, filter, delay, mergeMap, distinct } from 'rxjs/operators';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';
import { APIResource } from '../../../../store/types/api.types';
import { Route } from '../../../../store/types/route.types';
import { Domain } from '../../../../store/types/domain.types';

@Component({
  selector: 'app-add-routes',
  templateUrl: './add-routes.component.html',
  styleUrls: ['./add-routes.component.scss']
})
export class AddRoutesComponent implements OnInit, OnDestroy {

  submitted: boolean;
  model: Route;
  domains: APIResource<Domain>[] = [];
  addRoute: FormGroup;
  domains$: Subscription;
  space$: Subscription;
  associateRoute$: Subscription;
  appGuid: string;
  cfGuid: string;
  spaceGuid: string;
  createTCPRoute = false;

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService, private store: Store<AppState>) {
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
   }

  appService = this.applicationService;

  ngOnInit() {
    this.addRoute = new FormGroup({
      host: new FormControl(''),
      domain: new FormControl('', [<any>Validators.required]),
      path: new FormControl(''),
      port: new FormControl('')
    });

    this.space$ = this.store.select(selectEntity('application', this.appGuid))
    .pipe(
      tap(p => {
        if (p) {
          this.spaceGuid = p.entity.space_guid;
          this.domains$ = this.store.select(selectNestedEntity('space', this.spaceGuid, ['entity', 'domains']))
          .pipe(
            tap(d => {
              if (d) {
                d.forEach(domain => {
                  this.domains[domain.metadata.guid] = domain;
                });
              }
            })
          ).subscribe();
        }
      })
    ).subscribe();

  }

  getDomainValues() {
    return Object.values(this.domains);
  }
  _getValueForKey(key) {
    return this.addRoute.value[key] ? this.addRoute.value[key] : '';
  }

  _getValue(key) {
    return this.addRoute.value[key] !== '' ? this.addRoute.value[key] : null;
  }

  onSubmit() {
    this.submitted = true;
    const newRouteGuid =  this._getValueForKey('host') +  this._getValueForKey('port') +
    this._getValueForKey('path') + this.addRoute.value.domain.metadata.guid;

    this.store.dispatch(new CreateRoute(
      newRouteGuid,
      this.cfGuid,
      new Route(
        this.addRoute.value.domain.metadata.guid, this.spaceGuid, this._getValue('host'), this._getValue('path'), this._getValue('port')
      )
    ));
    this.associateRoute$ = this.store.select(selectRequestInfo(RouteSchema.key, newRouteGuid))
    .pipe(
      filter(route => !route.creating),
      map(route => {
        if (route.error) {
          throw new Error('Failed to create route due to: !' + route.error);
        }
        const routeAssignAction = new AssociateRouteWithAppApplication(
          this.appGuid,
          route.response.result[0],
          this.cfGuid
        );
        this.store.dispatch(routeAssignAction);
        return { route, updatingKey: routeAssignAction ? routeAssignAction.updatingKey : null };
      }),
      tap(p => {
        this.submitted = false;
        this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid] }));
      }
    )).subscribe();
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
