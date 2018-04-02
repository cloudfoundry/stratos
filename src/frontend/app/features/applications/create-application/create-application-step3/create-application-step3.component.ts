import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CreateNewApplication } from '../../../../store/actions/application.actions';
import { GetOrganization } from '../../../../store/actions/organization.actions';
import { CreateRoute } from '../../../../store/actions/route.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import {
  applicationSchemaKey,
  domainSchemaKey,
  entityFactory,
  organizationSchemaKey,
  routeSchemaKey,
} from '../../../../store/helpers/entity-factory';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CreateNewApplicationState } from '../../../../store/types/create-application.types';
import { createGetApplicationAction } from '../../application.service';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';
import { AssociateRouteWithAppApplication } from '../../../../store/actions/application-service-routes.actions';

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

  domains: Observable<any>;

  message = null;

  newAppData: CreateNewApplicationState;
  onNext: StepOnNextFunction = () => {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry } = cloudFoundryDetails;
    return Observable.combineLatest(
      this.createApp(),
      this.createRoute()
    )
      .filter(([app, route]) => {
        return !app.creating && !route.creating;
      })
      .map(([app, route]) => {
        if (app.error || route.error) {
          throw new Error(app.error ? 'Could not create application' : 'Could not create route');
        }
        // Did we create a route?
        const createdRoute = route !== 'NO_ROUTE';
        if (createdRoute) {
          // Then assign it to the application
          this.store.dispatch(new AssociateRouteWithAppApplication(
            app.response.result[0],
            route.response.result[0],
            cloudFoundry
          ));
        }
        this.store.dispatch(createGetApplicationAction(app.response.result[0], cloudFoundry));
        this.store.dispatch(new RouterNav({ path: ['applications', cloudFoundry, app.response.result[0], 'summary'] }));
        return { success: true };
      });
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
    return this.store.select(selectRequestInfo(applicationSchemaKey, newAppGuid));
  }

  createRoute(): Observable<RequestInfoState> | Observable<string> {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry, org, space } = cloudFoundryDetails;
    const routeDomainMetaData = this.form.controls.domain.value.metadata || null;
    const hostName = this.hostName;
    const shouldCreate = routeDomainMetaData && hostName && this.form.valid;
    const domainGuid = routeDomainMetaData ? routeDomainMetaData.guid : '';
    const newRouteGuid = hostName + domainGuid;

    if (shouldCreate) {
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
    return shouldCreate ? this.store.select(selectRequestInfo(routeSchemaKey, newRouteGuid)) : Observable.of('NO_ROUTE');
  }

  ngOnInit() {
    this.domains = this.store.select(selectNewAppState).pipe(
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
            return entity.entity.domains;
          })
        );
      })
    );
  }

}
