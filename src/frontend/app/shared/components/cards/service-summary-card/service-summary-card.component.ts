import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { Observable } from 'rxjs/Observable';
import { APIResource } from '../../../../store/types/api.types';
import { IService } from '../../../../core/cf-api-svc.types';
import { AppChip } from '../../../../shared/components/chips/chips.component';
import { ServiceTag } from '../../../../shared/components/list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { map, tap } from 'rxjs/operators';
import { ServicesService } from '../../../../features/service-catalog/services.service';

@Component({
  selector: 'app-service-summary-card',
  templateUrl: './service-summary-card.component.html',
  styleUrls: ['./service-summary-card.component.scss']
})
export class ServiceSummaryCardComponent implements OnInit {
  tags: AppChip<ServiceTag>[] = [];
  service$: Observable<APIResource<IService>>;
  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService
  ) {

    this.service$ = servicesService.service$;

    this.service$.pipe(
      tap(service => {
        this.tags = service.entity.tags.map(t => ({
          value: t,
          hideClearButton: true
        }));
      })
    ).subscribe();

  }

  ngOnInit() {
  }

}
