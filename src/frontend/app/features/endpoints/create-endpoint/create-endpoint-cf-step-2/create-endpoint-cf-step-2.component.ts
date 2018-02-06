/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit, AfterContentInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { StepOnNextFunction, IStepperStep } from '../../../../shared/components/stepper/step/step.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { UtilsService } from '../../../../core/utils.service';
import { EndpointModel, EndpointState, endpointStoreNames } from '../../../../store/types/endpoint.types';
import { NgForm, NgModel } from '@angular/forms';
import { endpointEntitiesSelector } from '../../../../store/selectors/endpoint.selectors';

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
    this.endpointUrls = store.select(endpointEntitiesSelector)
      .map(endpoints => Object.values(endpoints).map(endpoint => {
        if (endpoint.api_endpoint) {
          return `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}`;
        } else {
          return 'Unknown';
        }
      }));
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
