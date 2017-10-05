import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { selectEntityRequestInfo } from '../../../../store/actions/api.actions';
import {
    ApplicationSchema,
    AssociateRouteWithAppApplication,
    CreateNewApplication,
} from '../../../../store/actions/application.actions';
import { CreateRoute, RouteSchema } from '../../../../store/actions/route.actions';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import { CreateNewApplicationState } from '../../../../store/reducers/create-application.reducer';

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

  newAppData: CreateNewApplicationState;
  onNext: StepOnNextFunction = () => {
    const { cloudFoundryDetails, name } = this.newAppData;

    const { cloudFoundry, org, space } = cloudFoundryDetails;
    const newAppGuid = name + space.guid;

    this.store.dispatch(new CreateNewApplication(
      newAppGuid,
      cloudFoundry.guid, {
        name,
        space_guid: space.guid
      }
    ));

    const routeDomainMetaData = this.form.controls.domain.value.metadata;
    const hostName = this.hostName;
    const shouldCreateRoute = routeDomainMetaData && hostName && this.form.valid;
    const newRouteGuid = hostName + routeDomainMetaData.guid;

    if (shouldCreateRoute) {
      this.store.dispatch(new CreateRoute(
        newRouteGuid,
        cloudFoundry.guid,
        {
          space_guid: space.guid,
          domain_guid: routeDomainMetaData.guid,
          host: hostName
        }
      ));
    }

    return Observable.combineLatest(
      this.store.select(selectEntityRequestInfo(ApplicationSchema.key, newAppGuid)),
      // If we don't create a route, just fake it till we make it!
      shouldCreateRoute ?
        this.store.select(selectEntityRequestInfo(RouteSchema.key, newRouteGuid)) :
        Observable.of({ fake: true, creating: false, error: false })
    )
      .filter(([app, route]) => {
        return !app.creating && !route.creating;
      })
      .map(([app, route]) => {
        debugger;
        if (!app.error && !route.error) {
          this.store.dispatch(new AssociateRouteWithAppApplication(
            app.response.result[0],
            route.response.result[0],
            cloudFoundry.guid
          ));
          this.router.navigateByUrl(`/applications/${cloudFoundry.guid}/${app.response.result[0]}/summary`);
        }
        return { success: !app.error && !route.error };
      });
  }

  ngOnInit() {
    this.store.select(selectNewAppState)
      .subscribe(state => {
        console.log(state);
        this.hostName = state.name.split(' ').join('-').toLowerCase();
        this.newAppData = state;
      });
  }

}
