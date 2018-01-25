import { EntityInfo, APIResource } from '../../../../store/types/api.types';
import { selectRequestInfo, selectUpdateInfo, selectEntity } from '../../../../store/selectors/api.selectors';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs/Rx';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import {
  ApplicationSchema,
  AssociateRouteWithAppApplication,
  CreateNewApplication,
  GetApplication,
} from '../../../../store/actions/application.actions';
import { CreateRoute, RouteSchema } from '../../../../store/actions/route.actions';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import { CreateNewApplicationState } from '../../../../store/types/create-application.types';
import { RouterNav } from '../../../../store/actions/router.actions';
import { OrganisationSchema } from '../../../../store/actions/organisation.action';

@Component({
  selector: 'app-create-application-step3',
  templateUrl: './create-application-step3.component.html',
  styleUrls: ['./create-application-step3.component.scss']
})
export class CreateApplicationStep3Component implements OnInit {

  constructor(private store: Store<AppState>, private router: Router) { }

  @ViewChild('form')
  form: NgForm;

  hostName: string;

  domains: Observable<any>;

  message = null;

  newAppData: CreateNewApplicationState;
  onNext: StepOnNextFunction = () => {
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

    const routeDomainMetaData = this.form.controls.domain.value.metadata || null;
    const hostName = this.hostName;
    const shouldCreateRoute = routeDomainMetaData && hostName && this.form.valid;
    const domainGuid = routeDomainMetaData ? routeDomainMetaData.guid : '';
    const newRouteGuid = hostName + domainGuid;

    if (shouldCreateRoute) {
      this.store.dispatch(new CreateRoute(
        newRouteGuid,
        cloudFoundry,
        {
          space_guid: space,
          domain_guid: domainGuid,
          host: hostName
        }
      ));
    }

    this.message = `Creating application${shouldCreateRoute ? ' and route' : ''}`;
    // FIXME This isn't manageable, we should split it into multiple observables.
    return Observable.combineLatest(
      this.store.select(selectRequestInfo(ApplicationSchema.key, newAppGuid)),
      // If we don't create a route, just fake it till we make it!
      shouldCreateRoute ?
        this.store.select(selectRequestInfo(RouteSchema.key, newRouteGuid)) :
        Observable.of({ fake: true, creating: false, error: false })
    )
      .filter(([app, route]) => {
        return !app.creating && !route.creating;
      })
      .map(([app, route]) => {
        if (app.error || route.error) {
          throw new Error('Nope!');
        }
        this.message = `Finished creating application${shouldCreateRoute ? ' and route' : ''}`;
        let routeAssignAction;
        if (shouldCreateRoute) {
          routeAssignAction = new AssociateRouteWithAppApplication(
            app.response.result[0],
            route.response.result[0],
            cloudFoundry
          );
          this.store.dispatch(routeAssignAction);
        }
        return { app, route, updatingKey: routeAssignAction ? routeAssignAction.updatingKey : null };
      })
      .delay(1)
      .mergeMap(({ app, route, updatingKey }) => {
        this.message = `Assigning creating application${shouldCreateRoute ? ' and route' : ''}`;
        return (
          shouldCreateRoute ?
            this.store.select(selectUpdateInfo(
              ApplicationSchema.key,
              app.response.result[0],
              updatingKey
            ))
              .filter((update) => {
                return update.busy;
              }) :
            Observable.of({
              error: false
            })
        ).withLatestFrom(Observable.of({ app, route, updatingKey }));
      })
      .map(([update, { app, route, updatingKey }]) => {
        // We need to re-fetch the whole application to ensure we get all of the data.
        if (!update.error) {
          this.store.dispatch(new GetApplication(
            app.response.result[0],
            cloudFoundry
          ));
          this.store.dispatch(new RouterNav({ path: ['applications', cloudFoundry, app.response.result[0], 'summary'] }));
        }
        return { success: !update };
      });
  }

  ngOnInit() {
    const state$ = this.store.select(selectNewAppState);

    this.domains = state$
      .do(state => {
        this.hostName = state.name.split(' ').join('-').toLowerCase();
        this.newAppData = state;
      })
      .filter(state => state.cloudFoundryDetails && state.cloudFoundryDetails.org)
      .mergeMap(state => {
        return this.store.select(selectEntity(OrganisationSchema.key, state.cloudFoundryDetails.org))
          .first()
          .map(org => org.entity.domains);
      });
  }

}
