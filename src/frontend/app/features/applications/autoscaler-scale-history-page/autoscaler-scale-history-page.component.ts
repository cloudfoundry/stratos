import { Component, OnDestroy, OnInit, HostBinding } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { SetCFDetails, SetNewAppName } from '../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../store/app-state';
import { ApplicationService } from '../application.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../store/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction } from '../../../store/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../store/types/app-autoscaler.types';
import {
  GetAppAutoscalerAppMetricAction,
} from '../../../store/actions/app-autoscaler.actions';
import {
  AppAutoscalerAppMetric,
} from '../../../store/types/app-autoscaler.types';
import {
  appAutoscalerAppMetricSchemaKey,
} from '../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { normalColor } from '../../../store/helpers/autoscaler-helpers';
import {
  CfAppAutoscalerEventsConfigService,
} from '../../../shared/components/list/list-types/app-autoscaler-event/cf-app-autoscaler-events-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-autoscaler-scale-history-page',
  templateUrl: './autoscaler-scale-history-page.component.html',
  styleUrls: ['./autoscaler-scale-history-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAppAutoscalerEventsConfigService,
  }]
})
export class AutoscalerScaleHistoryPageComponent {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/auto-scaler`;

  constructor(
    public applicationService: ApplicationService,
  ) {
  }
}
