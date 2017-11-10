import { Component, OnInit } from '@angular/core';
import { IStepperStep } from '../create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { Observable } from "rxjs/Observable";

@Component({
  selector: 'app-create-endpoint-cf-step-2',
  templateUrl: './create-endpoint-cf-step-2.component.html',
  styleUrls: ['./create-endpoint-cf-step-2.component.scss']
})
export class CreateEndpointCfStep2Component implements OnInit, IStepperStep {

  validate: Observable<boolean>;

  constructor() { }

  ngOnInit() {
  }

  onNext(): Observable<boolean> {
    return Observable.of(true);
  }
}
