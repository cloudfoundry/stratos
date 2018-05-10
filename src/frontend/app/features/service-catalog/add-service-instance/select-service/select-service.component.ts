import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, share } from 'rxjs/operators';

import { IService } from '../../../../core/cf-api-svc.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesWallService } from '../../../services/services/services-wall.service';
import { ServicesService } from '../../services.service';

@Component({
  selector: 'app-select-service',
  templateUrl: './select-service.component.html',
  styleUrls: ['./select-service.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class SelectServiceComponent implements OnInit {
  services$: Observable<APIResource<IService>[]>;
  stepperForm: FormGroup;
  validate = Observable.of(true);

  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private servicesWallService: ServicesWallService
  ) {
    this.stepperForm = new FormGroup({
      service: new FormControl(''),
    });

    this.services$ = servicesWallService.services$;

  }

  onNext = () => Observable.of({
    success: true
  })

  ngOnInit() {
  }

}
