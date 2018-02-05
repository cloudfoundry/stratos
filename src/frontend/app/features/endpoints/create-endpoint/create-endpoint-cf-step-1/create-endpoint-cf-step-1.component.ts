/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, ViewChild, AfterContentInit } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CNSISModel, CNSISState, cnsisStoreNames } from '../../../../store/types/cnsis.types';
import { UtilsService } from '../../../../core/utils.service';
import { StepOnNextFunction, IStepperStep } from '../../../../shared/components/stepper/step/step.component';
import { cnsisEntitiesSelector } from '../../../../store/selectors/cnsis.selectors';
import { selectRequestInfo, selectUpdateInfo } from '../../../../store/selectors/api.selectors';
import { RouterNav } from '../../../../store/actions/router.actions';
import { RegisterCnis } from '../../../../store/actions/cnsis.actions';
import { CNSISEffect } from '../../../../store/effects/cnsis.effects';

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements OnInit, IStepperStep, AfterContentInit {

  endpointNames: Observable<string[]>;

  @ViewChild('form') form: NgForm;
  @ViewChild('nameField') nameField: NgModel;
  @ViewChild('nameField') urlField: NgModel;
  @ViewChild('nameField') skipSllField: NgModel;

  validate: Observable<boolean>;

  constructor(private store: Store<AppState>, private utilsService: UtilsService) {
    this.endpointNames = store.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis).map(cnsi => cnsi.name));
  }

  ngOnInit() {}

  onNext: StepOnNextFunction = () => {
    const action = new RegisterCnis(
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value
    );
    
    this.store.dispatch(action);

    const update$ = this.store.select(
      this.getUpdateSelector(action.guid())
    );

    return update$.pairwise()
    .filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy))
    .map(([oldVal, newVal]) => newVal)
    .map(result => {
      if (!result.error) {
        // Endpoints will fetch info which will refresh the list of endpoints
        this.store.dispatch(new RouterNav({ path: ['endpoints'] }));
      }

      // NOTE: Errors such as SSL errors can be fixed by the user, so don't want to take them away
      // TODO

      return {
        success: !result.error
      }
    });
  }

  private getUpdateSelector(guid) {
    return selectUpdateInfo(
      cnsisStoreNames.type,
      guid,
      CNSISEffect.registeringKey,
    );
  }

  ngAfterContentInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }

}
