import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  validate = () => true;

  submit = () => Observable.of(true);

}
