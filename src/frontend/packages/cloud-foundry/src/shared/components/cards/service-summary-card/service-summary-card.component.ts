import { CommonModule } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';

import { Observable, of as observableOf } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BooleanIndicatorComponent } from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { AppChipsComponent } from '../../../../../../core/src/shared/components/chips/chips.component';
import {
  MetaCardComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import {
  MetaCardItemComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import {
  MetaCardKeyComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import {
  MetaCardTitleComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import {
  MetaCardValueComponent,
} from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { ClickStopPropagationDirective } from '@stratosui/core';
import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import {
  ServiceTag,
} from '../../../../../../cloud-foundry/src/shared/components/list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { AppChip } from '../../../../../../core/src/shared/components/chips/chips.component';
import { APIResource } from '../../../../../../store/src/types/api.types';
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
