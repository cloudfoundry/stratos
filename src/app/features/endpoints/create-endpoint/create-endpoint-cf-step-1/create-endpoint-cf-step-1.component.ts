import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, ViewChild, AfterContentInit } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CNSISState } from '../../../../store/types/cnsis.types';
import { UtilsService } from '../../../../core/utils.service';

// TODO: RC MOVE ME
export interface IStepperStep {
  validate: Observable<boolean>;
  onNext(): Observable<boolean>;
}

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements OnInit, IStepperStep, AfterContentInit {

  endpointNames: Observable<string[]>;
  endpointUrls: Observable<string[]>;

  @ViewChild('form') form: NgForm;
  @ViewChild('urlField') urlField: NgModel;
  @ViewChild('nameField') nameField: NgModel;
  @ViewChild('skipSllField') skipSllField: NgModel;

  validate: Observable<boolean>;

  constructor(store: Store<AppState>, private utilsService: UtilsService) {
    this.endpointNames = store.select('cnsis').map((cnsis: CNSISState) => cnsis.entities.map(cnsi => cnsi.name));
    this.endpointUrls = store.select('cnsis')
      .map((cnsis: CNSISState) => cnsis.entities.map(cnsi => `${cnsi.api_endpoint.Scheme}://${cnsi.api_endpoint.Host}`));
  }

  print() {
    console.log(this.urlField);
  }

  ngOnInit() {
  }

  onNext(): Observable<boolean> {
    return Observable.of(true);
  }

  ngAfterContentInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }

}
