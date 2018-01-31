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

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements OnInit, IStepperStep, AfterContentInit {

  endpointNames: Observable<string[]>;

  @ViewChild('form') form: NgForm;
  @ViewChild('nameField') nameField: NgModel;

  validate: Observable<boolean>;

  constructor(store: Store<AppState>, private utilsService: UtilsService) {
    this.endpointNames = store.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis).map(cnsi => cnsi.name));
  }

  ngOnInit() {
  }

  onNext: StepOnNextFunction = () => Observable.of({ success: true });

  ngAfterContentInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }

}
