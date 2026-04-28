import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  getPlanAccessibilityV3,
} from '../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { IServicePlan } from '../../../cf-api-svc.types';
import { ServiceCatalogDataService } from '../../../services/endpoint-data/service-catalog-data.service';

@Component({
  selector: 'app-service-plan-public',
  templateUrl: './service-plan-public.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ServicePlanPublicComponent {
  private serviceCatalog = inject(ServiceCatalogDataService);

  planAccessibility$: Observable<StratosStatus>;
  planAccessibilityMessage$: Observable<string>;
  private pServicePlan: APIResource<IServicePlan>;

  @Input()
  get servicePlan(): APIResource<IServicePlan> {
    return this.pServicePlan;
  }

  set servicePlan(servicePlan: APIResource<IServicePlan>) {
    this.pServicePlan = servicePlan;
    if (!servicePlan || !servicePlan.entity) {
      return;
    }
    const cfGuid = servicePlan.entity.cfGuid;
    const planGuid = servicePlan.metadata.guid;
    const isPublicPlan = !!servicePlan.entity.public;

    this.planAccessibility$ = this.serviceCatalog.planVisibility(cfGuid, planGuid).pipe(
      // Visibility lookup may legitimately 4xx for plans the caller can't
      // see (e.g. admin-only) — fall through to "no visibility" rather than
      // breaking the page. The helper treats null as the admin/error case.
      catchError(() => observableOf(null)),
      map(visibility => getPlanAccessibilityV3(isPublicPlan, visibility)),
    );
    this.planAccessibilityMessage$ = this.planAccessibility$.pipe(
      map(o => {
        if (o === StratosStatus.WARNING) {
          return 'Service Plan has limited visibility';
        } else if (o === StratosStatus.ERROR) {
          return 'Service Plan has no visibility';
        }
        return '';
      })
    );
  }
}
