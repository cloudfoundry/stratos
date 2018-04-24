import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ServicesService } from '../../services.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss']
})
export class SpecifyDetailsStepComponent implements OnInit {

  servicePlanGuids$: Observable<string[]>;

  constructor(private servicesService: ServicesService) {


  }

  ngOnInit() {
  }


  validate = () => true;

  onNext = () => Observable.of({ success: true });
}
