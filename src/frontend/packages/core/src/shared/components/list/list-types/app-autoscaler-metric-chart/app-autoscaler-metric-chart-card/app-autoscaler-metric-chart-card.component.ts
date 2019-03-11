import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { IServiceBinding } from '../../../../../../core/cf-api-svc.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import { CardCell, IListRowCell, IListRowCellData } from '../../../list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import {
  entityFactory,
  appAutoscalerAppMetricSchemaKey
} from '../../../../../../../../store/src/helpers/entity-factory';
import {
  GetAppAutoscalerAppMetricAction,
} from '../../../../../../../../store/src/actions/app-autoscaler.actions';
import { getPaginationObservables } from '../../../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { AppState } from '../../../../../../../../store/src/app-state';
import { Store } from '@ngrx/store';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import {
  AppAutoscalerAppMetric,
} from '../../../../../../../../store/src/types/app-autoscaler.types';
import { buildLegendData } from '../../../../../../../../store/src/helpers/autoscaler-helpers';

interface EnvVarData {
  key: string;
  value: string;
}
@Component({
  selector: 'app-app-autoscaler-metric-chart-card',
  templateUrl: './app-autoscaler-metric-chart-card.component.html',
  styleUrls: ['./app-autoscaler-metric-chart-card.component.scss']
})
export class AppAutoscalerMetricChartCardComponent extends CardCell<APIResource<IServiceBinding>> implements OnInit, IListRowCell {

  listData: IListRowCellData[];
  envVarUrl: string;

  comboBarScheme = {
    name: 'singleLightBlue',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };

  public current = (new Date()).getTime();
  public paramsMetrics = {
    'start-time': this.current - 30 * 60 * 1000 + '000000',
    'end-time': this.current + '000000',
    'page': '1',
    'results-per-page': '10000000',
    'order': 'asc'
  };

  constructor(
    private dialog: MatDialog,
    private appService: ApplicationService,
    private serviceActionHelperService: ServiceActionHelperService,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    super();
  }

  public metricData$;
  public appAutoscalerAppMetricLegend;

  getLegend2(trigger) {
    const legendColor = buildLegendData(trigger);
    const legendValue = [];
    legendColor.map((item) => {
      legendValue.push({
        name: item.name,
        value: 1
      });
    });
    return {
      legendValue,
      legendColor
    };
  }

  ngOnInit(): void {
    if (this.row.entity['query'] && this.row.entity['query']['params']) {
      this.paramsMetrics['start-time'] = this.row.entity['query']['params']['start'] + '000000000';
      this.paramsMetrics['end-time'] = this.row.entity['query']['params']['end'] + '000000000';
    }
    this.appAutoscalerAppMetricLegend = this.getLegend2(this.row.entity);
    this.metricData$ = this.getAppMetric(this.row.metadata.guid, this.row.entity, this.paramsMetrics);
  }

  showEnvVars = (envVarData: EnvVarData) => {
    this.dialog.open(EnvVarViewComponent, {
      data: envVarData,
      disableClose: false
    });
  }

  detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      [this.row],
      this.row.entity.service_instance_guid,
      this.appService.cfGuid
    );
  }

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.row.entity.service_instance_guid,
    this.appService.cfGuid,
    { 'appId': this.appService.appGuid }
  )

  getAppMetric(metricName: string, trigger: any, params: any) {
    const action = new GetAppAutoscalerAppMetricAction(this.appService.appGuid,
      this.appService.cfGuid, metricName, false, trigger, params);
    this.store.dispatch(action);
    return getPaginationObservables<AppAutoscalerAppMetric>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appAutoscalerAppMetricSchemaKey)
      )
    }, false).entities$;
  }

}
