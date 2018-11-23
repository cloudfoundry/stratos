import { Component } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IService } from '../../../../core/cf-api-svc.types';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { AppChip } from '../../../../shared/components/chips/chips.component';
import { ServiceTag } from '../../../../shared/components/list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { APIResource } from '../../../../store/types/api.types';


@Component({
  selector: 'app-service-summary-card',
  templateUrl: './service-summary-card.component.html',
  styleUrls: ['./service-summary-card.component.scss']
})
export class ServiceSummaryCardComponent {
  tags: AppChip<ServiceTag>[] = [];
  service$: Observable<APIResource<IService>>;
  constructor(
    public servicesService: ServicesService
  ) {
    this.service$ = servicesService.service$;

    this.service$.pipe(
      tap(service => {
        this.tags = service.entity.tags.map(t => ({
          value: t,
          hideClearButton$: observableOf(true)
        }));
      })
    ).subscribe();
  }

}
