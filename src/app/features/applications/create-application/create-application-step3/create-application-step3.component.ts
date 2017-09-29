import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CreateNewApplication } from '../../../../store/actions/application.actions';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import { CreateNewApplicationState } from '../../../../store/reducers/create-application.reducer';

@Component({
  selector: 'app-create-application-step3',
  templateUrl: './create-application-step3.component.html',
  styleUrls: ['./create-application-step3.component.scss']
})
export class CreateApplicationStep3Component implements OnInit {

  constructor(private store: Store<AppState>) { }

  newAppData: CreateNewApplicationState;
  onNext: StepOnNextFunction;
  ngOnInit() {
    this.store.select(selectNewAppState).subscribe(state => {
      this.newAppData = state;
    });
    this.onNext = () => {
      const { cloudFoundryDetails, name } = this.newAppData;

      const {
        cloudFoundry,
        org,
        space
      } = cloudFoundryDetails;
      const reqGuid = name + space.guid;
      this.store.dispatch(new CreateNewApplication(
        reqGuid,
        cloudFoundry.guid,
        {
          name,
          space_guid: space.guid
        }
      ));
      return Observable.of({
        success: false
      });
    };
  }

}
