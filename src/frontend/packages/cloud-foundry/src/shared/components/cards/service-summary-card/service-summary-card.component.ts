import { CommonModule } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';

import { Observable, of as observableOf } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  BooleanIndicatorComponent,
  AppChipsComponent,
  AppChip,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  ClickStopPropagationDirective
} from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import {
  ServiceTag,
} from '../../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { IService } from '../../../../cf-api-svc.types';
import { ServiceIconComponent } from '../../service-icon/service-icon.component';


@Component({
  selector: 'app-service-summary-card',
  templateUrl: './service-summary-card.component.html',
  styleUrls: ['./service-summary-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    ServiceIconComponent,
    BooleanIndicatorComponent,
    AppChipsComponent,
    ClickStopPropagationDirective
  ]
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
        if (service && service.entity && service.entity.tags) {
          this.tags = service.entity.tags.map(t => ({
            value: t,
            hideClearButton$: observableOf(true)
          }));
        } else {
          this.tags = [];
        }
      })
    ).subscribe();
  }

}
