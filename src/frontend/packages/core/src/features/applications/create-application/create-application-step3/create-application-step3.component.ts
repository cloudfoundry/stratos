import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { catchError, filter, first, map, mergeMap, switchMap, tap } from 'rxjs/operators';

import { IDomain } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';

import { createGetApplicationAction } from '../../application.service';
import { AppState } from '../../../../../../store/src/app-state';
import { CreateNewApplicationState } from '../../../../../../store/src/types/create-application.types';
import { RequestInfoState, getDefaultRequestState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { CreateNewApplication } from '../../../../../../store/src/actions/application.actions';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import {
  applicationSchemaKey,
  routeSchemaKey,
  organizationSchemaKey,
  entityFactory,
  domainSchemaKey
} from '../../../../../../store/src/helpers/entity-factory';
import { CreateRoute } from '../../../../../../store/src/actions/route.actions';
import { AssociateRouteWithAppApplication } from '../../../../../../store/src/actions/application-service-routes.actions';
import { selectNewAppState } from '../../../../../../store/src/effects/create-app-effects';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { GetOrganization } from '../../../../../../store/src/actions/organization.actions';
import { createEntityRelationKey } from '../../../../../../store/src/helpers/entity-relations/entity-relations.types';


@Component({
  selector: 'app-create-application-step3',
  templateUrl: './create-application-step3.component.html',
  styleUrls: ['./create-application-step3.component.scss']
})
export class CreateApplicationStep3Component implements OnInit {

  constructor(private store: Store<AppState>, private router: Router, private entityServiceFactory: EntityServiceFactory) { }

  @ViewChild('form')
  form: NgForm;

  hostName: string;

  domains$: Observable<IDomain[]>;
  selectedDomainGuid: string;

  message = null;

  newAppData: CreateNewApplicationState;
  onNext: StepOnNextFunction = () => {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry } = cloudFoundryDetails;
    return this.createApp().pipe(
      switchMap(app => {
        return combineLatest(
          observableOf(app),
          this.createRoute()
        );
      }),
      switchMap(([app, route]: [RequestInfoState, RequestInfoState]) => {
        // Did we create a route?
        const createdRoute = !app.error && !route.error && route.message !== 'NO_ROUTE';
        // Then assign it to the application
        const obs$ = createdRoute ?
          this.associateRoute(app.response.result[0], route.response.result[0], cloudFoundry) :
          observableOf(null);
        return obs$.pipe(
          map(() => app.response.result[0] as string)
        );
      }),
      map(appGuid => {
        this.store.dispatch(createGetApplicationAction(appGuid, cloudFoundry));
        this.store.dispatch(new RouterNav({ path: ['applications', cloudFoundry, appGuid, 'summary'] }));
        return { success: true };
      }),
      catchError((err: Error) => {
        return observableOf({ success: false, message: err.message });
      })
    );
  }

  validate(): boolean {
    return !!this.selectedDomainGuid && !!this.hostName;
  }

  createApp(): Observable<RequestInfoState> {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry, org, space } = cloudFoundryDetails;
    const newAppGuid = name + space;

    this.store.dispatch(new CreateNewApplication(
      newAppGuid,
      cloudFoundry, {
        name,
        space_guid: space
      }
    ));
    return this.wrapObservable(this.store.select(selectRequestInfo(applicationSchemaKey, newAppGuid)), 'Could not create application');
  }

  createRoute(): Observable<RequestInfoState> {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry, org, space } = cloudFoundryDetails;
    const hostName = this.hostName;
    const shouldCreate = this.selectedDomainGuid && hostName && this.form.valid;
    const newRouteGuid = hostName + this.selectedDomainGuid;

    if (shouldCreate) {
      this.store.dispatch(new CreateRoute(
        newRouteGuid,
        cloudFoundry,
        {
          space_guid: space,
          domain_guid: this.selectedDomainGuid,
          host: hostName
        }
      ));
      return this.wrapObservable(this.store.select(selectRequestInfo(routeSchemaKey, newRouteGuid)),
        'Application created. Could not create route');
    }
    return observableOf({
      ...getDefaultRequestState(),
      message: 'NO_ROUTE'
    });
  }

  associateRoute(appGuid, routeGuid, endpointGuid): Observable<RequestInfoState> {
    this.store.dispatch(new AssociateRouteWithAppApplication(appGuid, routeGuid, endpointGuid));
    return this.wrapObservable(this.store.select(selectRequestInfo(applicationSchemaKey, appGuid)),
      'Application and route created. Could not associated route with app');
  }

  private wrapObservable(obs$: Observable<RequestInfoState>, errorString: string): Observable<RequestInfoState> {
    return obs$.pipe(
      filter((state: RequestInfoState) => {
        return state && !state.creating;
      }),
      first(),
      tap(state => {
        if (state.error) {
          const fullErrorString = errorString + (state.message ? `: ${state.message}` : '');
          throw new Error(fullErrorString);
        }
      })
    );
  }

  ngOnInit() {
    this.domains$ = this.store.select(selectNewAppState).pipe(
      filter(state => state.cloudFoundryDetails && state.cloudFoundryDetails.cloudFoundry && state.cloudFoundryDetails.org),
      mergeMap(state => {
        this.hostName = state.name.split(' ').join('-').toLowerCase();
        this.newAppData = state;
        const orgEntService = this.entityServiceFactory.create<APIResource<any>>(
          organizationSchemaKey,
          entityFactory(organizationSchemaKey),
          state.cloudFoundryDetails.org,
          new GetOrganization(state.cloudFoundryDetails.org, state.cloudFoundryDetails.cloudFoundry, [
            createEntityRelationKey(organizationSchemaKey, domainSchemaKey)
          ]),
          true
        );
        return orgEntService.waitForEntity$.pipe(
          map(({ entity, entityRequestInfo }) => {
            if (!this.selectedDomainGuid && entity.entity.domains && entity.entity.domains.length) {
              this.selectedDomainGuid = entity.entity.domains[0].entity.guid;
            }
            return entity.entity.domains;
          })
        );
      })
    );
  }

}
