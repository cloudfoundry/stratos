import { Observable } from 'rxjs/Observable';
import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';

import 'rxjs/add/observable/of';



export type StepOnNextFunction = () => Observable<{
  success: boolean,
  message?: string
}>;

@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],

})

export class StepComponent implements OnInit {

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;
  active = false;
  valid = false;
  complete = false;
  error = false;
  busy = false;

  @Input()
  title: string;

  @Input()
  validate: Observable<boolean> = Observable.of(true);

  @Input()
  onNext: StepOnNextFunction = () => Observable.of({ success: true })

  constructor() { }

  ngOnInit() {
  }

}
