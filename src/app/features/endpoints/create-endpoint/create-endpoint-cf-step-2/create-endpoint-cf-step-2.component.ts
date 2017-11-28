/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit, AfterContentInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { StepOnNextFunction, IStepperStep } from '../../../../shared/components/stepper/step/step.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { UtilsService } from '../../../../core/utils.service';
import { CNSISState } from '../../../../store/types/cnsis.types';
import { NgForm, NgModel } from '@angular/forms';

@Component({
  selector: 'app-create-endpoint-cf-step-2',
  templateUrl: './create-endpoint-cf-step-2.component.html',
  styleUrls: ['./create-endpoint-cf-step-2.component.scss']
})
export class CreateEndpointCfStep2Component implements OnInit, IStepperStep, AfterContentInit {

  endpointUrls: Observable<string[]>;

  validate: Observable<boolean>;

  @ViewChild('form') form: NgForm;
  @ViewChild('urlField') urlField: NgModel;
  @ViewChild('skipSllField') skipSllField: NgModel;

  constructor(store: Store<AppState>, public utilsService: UtilsService) {
    this.endpointUrls = store.select('cnsis')
      .map((cnsis: CNSISState) => cnsis.entities.map(cnsi => `${cnsi.api_endpoint.Scheme}://${cnsi.api_endpoint.Host}`));
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
