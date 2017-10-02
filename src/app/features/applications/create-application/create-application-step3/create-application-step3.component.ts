import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { selectEntityRequestInfo } from '../../../../store/actions/api.actions';
import { ApplicationSchema, CreateNewApplication } from '../../../../store/actions/application.actions';
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

  newAppData: CreateNewApplicationState;
  onNext: StepOnNextFunction;
  ngOnInit() {
    this.store.select(selectNewAppState).subscribe(state => {
      this.newAppData = state;
    });
    this.onNext = () => {
      const { cloudFoundryDetails, name } = this.newAppData;

      const { cloudFoundry, org, space } = cloudFoundryDetails;
      const reqGuid = name + space.guid;

      this.store.dispatch(new CreateNewApplication(
        reqGuid,
        cloudFoundry.guid, {
          name,
          space_guid: space.guid
        }
      ));

      return this.store.select(selectEntityRequestInfo(ApplicationSchema.key, reqGuid))
        .filter(state => {
          return !state.creating;
        }).map(state => {
          if (!state.error) {
            this.router.navigateByUrl(`/applications/${cloudFoundry.guid}/${state.response.result[0]}/summary`);
          }
          return { success: !state.error };
        });
    };
  }

}
