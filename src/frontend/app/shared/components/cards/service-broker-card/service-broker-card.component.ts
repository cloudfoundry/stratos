import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { Observable } from 'rxjs/Observable';
import { APIResource } from '../../../../store/types/api.types';
import { IServiceBroker } from '../../../../core/cf-api-svc.types';
import { filter, map } from 'rxjs/operators';
import { ServicesService } from '../../../../features/service-catalog/services.service';

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  styleUrls: ['./service-broker-card.component.scss']
})
export class ServiceBrokerCardComponent implements OnInit {

  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  constructor(
    private servicesService: ServicesService,
    private store: Store<AppState>
  ) {

    this.serviceBroker$ = this.servicesService.serviceBroker$;

  }

  ngOnInit() {
  }
}
