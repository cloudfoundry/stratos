import { Observable } from 'rxjs/Observable';
import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';

import 'rxjs/add/observable/of';

export type ValidatorFunction = () => Observable<boolean>;

@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss']
})

export class StepComponent implements OnInit {

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  active = false;

  valid = false;

  complete = false;

  @Input()
  title: string;

  @Input()
  validate: ValidatorFunction = () => Observable.of(true)

  @Input()
  onNext: ValidatorFunction = () => Observable.of(true)

  constructor() { }

  ngOnInit() {
  }

}
